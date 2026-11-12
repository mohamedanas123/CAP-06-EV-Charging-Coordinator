#!/usr/bin/env python3
"""
==============================================================================
CAP-06: EV Charging Queue & Grid-Demand Coordinator
ETL Pipeline: MySQL -> Pandas DataFrames -> CSV -> Amazon S3
==============================================================================
Extracts charging_session and telemetry records from the MySQL database,
transforms them into clean pandas DataFrames, exports them to CSV files,
and uploads them to Amazon S3 (partitioned by table folder) using the EC2
Instance IAM Role credentials.
==============================================================================
"""

import os
import sys
import argparse
import logging
from datetime import datetime
from pathlib import Path

import pandas as pd
import pymysql
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

# ------------------------------------------------------------------------------
# 1. Environment & Logging Configuration
# ------------------------------------------------------------------------------
# Automatically load .env from project root if present
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("CAP06-ETL")

# Database Configuration (Environment variables with safe defaults)
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ev-charging")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "anas")

# AWS S3 Configuration (Uses EC2 IAM Role via standard credential chain)
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "cap06-evcharging-data-unique-id")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_SESSIONS_PREFIX = os.getenv("S3_SESSIONS_PREFIX", "charging-sessions")
S3_TELEMETRY_PREFIX = os.getenv("S3_TELEMETRY_PREFIX", "telemetry")

# Default CSV Output Directory
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "data"

# ------------------------------------------------------------------------------
# 2. Database Connection
# ------------------------------------------------------------------------------
def get_db_connection():
    """Establish and return a connection to MySQL using pymysql."""
    logger.info(f"Connecting to MySQL database '{MYSQL_DATABASE}' at {MYSQL_HOST}:{MYSQL_PORT} (User: {MYSQL_USER})...")
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10
        )
        logger.info("Successfully connected to MySQL database.")
        return connection
    except pymysql.MySQLError as err:
        logger.error(f"Failed to connect to MySQL: {err}")
        raise

# ------------------------------------------------------------------------------
# 3. Extraction Phase
# ------------------------------------------------------------------------------
def extract_table(connection, table_name: str) -> list:
    """Extract all records from a given table using the connection."""
    logger.info(f"Extracting records from table '{table_name}'...")
    query = f"SELECT * FROM `{table_name}`"
    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            logger.info(f"Extracted {len(rows)} raw records from '{table_name}'.")
            return rows
    except pymysql.MySQLError as err:
        logger.error(f"Error querying table '{table_name}': {err}")
        raise

# ------------------------------------------------------------------------------
# 4. Transformation Phase
# ------------------------------------------------------------------------------
def transform_charging_sessions(raw_data: list) -> pd.DataFrame:
    """
    Transform charging_session records into a clean pandas DataFrame.
    Actual MySQL columns:
      session_id, request_id, charger_id, allocated_power_kw,
      energy_delivered_kwh, start_time, end_time, status, failure_reason
    """
    logger.info("Transforming 'charging_session' dataset...")
    if not raw_data:
        logger.warning("No records found in charging_session table. Creating empty DataFrame with schema.")
        columns = [
            "session_id", "request_id", "charger_id", "allocated_power_kw",
            "energy_delivered_kwh", "start_time", "end_time", "status", "failure_reason"
        ]
        return pd.DataFrame(columns=columns)

    df = pd.DataFrame(raw_data)

    # Validate required columns
    expected_cols = [
        "session_id", "request_id", "charger_id", "allocated_power_kw",
        "energy_delivered_kwh", "start_time", "end_time", "status", "failure_reason"
    ]
    for col in expected_cols:
        if col not in df.columns:
            logger.warning(f"Expected column '{col}' missing from charging_session query result.")

    # Cast integer identifiers
    for id_col in ["session_id", "request_id", "charger_id"]:
        if id_col in df.columns:
            df[id_col] = pd.to_numeric(df[id_col], errors="coerce").astype("Int64")

    # Cast numeric measurements
    for num_col in ["allocated_power_kw", "energy_delivered_kwh"]:
        if num_col in df.columns:
            df[num_col] = pd.to_numeric(df[num_col], errors="coerce").fillna(0.0).round(2)

    # Format datetime timestamps to standard ISO strings
    for dt_col in ["start_time", "end_time"]:
        if dt_col in df.columns:
            df[dt_col] = pd.to_datetime(df[dt_col], errors="coerce")
            df[dt_col] = df[dt_col].dt.strftime("%Y-%m-%d %H:%M:%S").fillna("")

    # Clean text columns
    if "status" in df.columns:
        df["status"] = df["status"].astype(str).str.strip()
    if "failure_reason" in df.columns:
        df["failure_reason"] = df["failure_reason"].fillna("").astype(str).str.strip()

    # Order columns logically
    ordered_cols = [
        "session_id", "request_id", "charger_id", "allocated_power_kw",
        "energy_delivered_kwh", "start_time", "end_time", "status", "failure_reason"
    ]
    df = df[[c for c in ordered_cols if c in df.columns]]

    logger.info(f"Successfully transformed {len(df)} charging_session rows.")
    return df

def transform_telemetry(raw_data: list) -> pd.DataFrame:
    """
    Transform telemetry records into a clean pandas DataFrame.
    Actual MySQL columns:
      telemetry_id, charger_id, session_id, power_consumption_kw,
      energy_kwh, soc_percent, temperature_celsius, recorded_at
    """
    logger.info("Transforming 'telemetry' dataset...")
    if not raw_data:
        logger.warning("No records found in telemetry table. Creating empty DataFrame with schema.")
        columns = [
            "telemetry_id", "charger_id", "session_id", "power_consumption_kw",
            "energy_kwh", "soc_percent", "temperature_celsius", "recorded_at"
        ]
        return pd.DataFrame(columns=columns)

    df = pd.DataFrame(raw_data)

    # Cast integer identifiers
    for id_col in ["telemetry_id", "charger_id", "session_id"]:
        if id_col in df.columns:
            df[id_col] = pd.to_numeric(df[id_col], errors="coerce").astype("Int64")

    # Cast numeric telemetry fields
    for float_col in ["power_consumption_kw", "energy_kwh", "soc_percent", "temperature_celsius"]:
        if float_col in df.columns:
            df[float_col] = pd.to_numeric(df[float_col], errors="coerce").fillna(0.0).round(3)

    # Format datetime timestamp
    if "recorded_at" in df.columns:
        df["recorded_at"] = pd.to_datetime(df[recorded_at_col := "recorded_at"], errors="coerce")
        df["recorded_at"] = df["recorded_at"].dt.strftime("%Y-%m-%d %H:%M:%S").fillna("")

    # Order columns logically
    ordered_cols = [
        "telemetry_id", "charger_id", "session_id", "power_consumption_kw",
        "energy_kwh", "soc_percent", "temperature_celsius", "recorded_at"
    ]
    df = df[[c for c in ordered_cols if c in df.columns]]

    logger.info(f"Successfully transformed {len(df)} telemetry rows.")
    return df

# ------------------------------------------------------------------------------
# 5. Export Phase (Local CSV)
# ------------------------------------------------------------------------------
def export_to_csv(df: pd.DataFrame, output_path: Path) -> Path:
    """Save DataFrame as a clean UTF-8 CSV without index."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8")
    size_kb = output_path.stat().st_size / 1024.0
    logger.info(f"Saved CSV: {output_path} ({len(df)} rows, {size_kb:.2f} KB)")
    return output_path

# ------------------------------------------------------------------------------
# 6. Upload Phase (Amazon S3 via IAM Role)
# ------------------------------------------------------------------------------
def upload_to_s3(local_file_path: Path, bucket: str, s3_key: str):
    """
    Upload a local file to Amazon S3.
    Uses boto3 default credential chain (EC2 IAM Role instance profile).
    """
    logger.info(f"Uploading '{local_file_path.name}' to s3://{bucket}/{s3_key}...")
    try:
        # Boto3 automatically discovers EC2 IAM Role credentials on EC2
        s3_client = boto3.client("s3", region_name=AWS_REGION)
        s3_client.upload_file(str(local_file_path), bucket, s3_key)
        logger.info(f"✓ Upload successful: s3://{bucket}/{s3_key}")
        return True
    except NoCredentialsError:
        logger.error(
            "AWS credentials not found. When running on EC2, ensure an IAM Role with "
            "S3 PutObject permissions is attached to the instance."
        )
        raise
    except ClientError as err:
        logger.error(f"S3 Client Error uploading to s3://{bucket}/{s3_key}: {err}")
        raise
    except Exception as err:
        logger.error(f"Unexpected error uploading to S3: {err}")
        raise

# ------------------------------------------------------------------------------
# 7. Main Pipeline Orchestrator
# ------------------------------------------------------------------------------
def run_pipeline(skip_s3: bool = False, output_dir: Path = DEFAULT_OUTPUT_DIR, bucket: str = S3_BUCKET_NAME):
    """Execute the complete MySQL -> Pandas -> CSV -> S3 ETL pipeline."""
    logger.info("=" * 65)
    logger.info(" CAP-06 ETL Pipeline: MySQL -> Pandas -> CSV -> Amazon S3")
    logger.info("=" * 65)

    conn = None
    try:
        # 1. Connect to MySQL
        conn = get_db_connection()

        # 2. Extract
        sessions_raw = extract_table(conn, "charging_session")
        telemetry_raw = extract_table(conn, "telemetry")

        # 3. Transform
        df_sessions = transform_charging_sessions(sessions_raw)
        df_telemetry = transform_telemetry(telemetry_raw)

        # 4. Export to CSV
        sessions_csv = export_to_csv(df_sessions, output_dir / "charging_sessions.csv")
        telemetry_csv = export_to_csv(df_telemetry, output_dir / "telemetry.csv")

        # 5. Upload to S3
        if skip_s3:
            logger.info("Skipping S3 upload as requested via --skip-s3 flag.")
        else:
            sessions_s3_key = f"{S3_SESSIONS_PREFIX.strip('/')}/charging_sessions.csv"
            telemetry_s3_key = f"{S3_TELEMETRY_PREFIX.strip('/')}/telemetry.csv"

            upload_to_s3(sessions_csv, bucket, sessions_s3_key)
            upload_to_s3(telemetry_csv, bucket, telemetry_s3_key)

        # 6. Pipeline Summary
        logger.info("=" * 65)
        logger.info(" ETL PIPELINE COMPLETED SUCCESSFULLY")
        logger.info("=" * 65)
        logger.info(f"• Charging Sessions Extracted: {len(df_sessions):,} rows")
        logger.info(f"• Telemetry Records Extracted: {len(df_telemetry):,} rows")
        logger.info(f"• Local CSV Files:             {output_dir}")
        if not skip_s3:
            logger.info(f"• S3 Target Bucket:            s3://{bucket}/")
            logger.info(f"  - Sessions Key:              s3://{bucket}/{S3_SESSIONS_PREFIX.strip('/')}/charging_sessions.csv")
            logger.info(f"  - Telemetry Key:             s3://{bucket}/{S3_TELEMETRY_PREFIX.strip('/')}/telemetry.csv")
        logger.info("=" * 65)

    except Exception as err:
        logger.critical(f"ETL Pipeline execution failed: {err}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            logger.info("MySQL connection closed.")

# ------------------------------------------------------------------------------
# 8. CLI Entrypoint
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CAP-06 MySQL to S3 ETL Pipeline")
    parser.add_argument(
        "--skip-s3",
        action="store_true",
        help="Extract and generate local CSVs without uploading to Amazon S3"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Local directory to write exported CSV files (default: analytics/data)"
    )
    parser.add_argument(
        "--bucket",
        type=str,
        default=S3_BUCKET_NAME,
        help=f"Target S3 bucket name (default: {S3_BUCKET_NAME})"
    )

    args = parser.parse_args()
    run_pipeline(skip_s3=args.skip_s3, output_dir=args.output_dir, bucket=args.bucket)
