FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy simulator source
COPY . .

# Run simulator streaming to backend
ENV BASE_URL=http://backend:8080/api
ENTRYPOINT ["python", "-u", "simulator.py"]
CMD ["--base-url", "http://backend:8080/api"]

