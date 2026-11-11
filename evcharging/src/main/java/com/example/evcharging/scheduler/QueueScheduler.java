package com.example.evcharging.scheduler;

import com.example.evcharging.entity.ChargingSite;
import com.example.evcharging.repository.ChargingSiteRepository;
import com.example.evcharging.service.ChargingSchedulerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class QueueScheduler {

    private static final Logger log = LoggerFactory.getLogger(QueueScheduler.class);

    private final ChargingSiteRepository siteRepository;
    private final ChargingSchedulerService schedulerService;

    public QueueScheduler(ChargingSiteRepository siteRepository, ChargingSchedulerService schedulerService) {
        this.siteRepository = siteRepository;
        this.schedulerService = schedulerService;
    }

    /**
     * Runs periodically every 5 seconds (5000 ms).
     * Iterates through all sites, locks them safely, checks capacity, and assigns waiting/reserved requests.
     */
    @Scheduled(fixedDelay = 5000)
    public void runAutomaticScheduling() {
        List<ChargingSite> sites = siteRepository.findAll();
        for (ChargingSite site : sites) {
            try {
                int assigned = schedulerService.scheduleWaitingRequests(site.getSiteId());
                if (assigned > 0) {
                    log.info("QueueScheduler: Automatically scheduled {} request(s) for site '{}' (ID: {})",
                            assigned, site.getSiteName(), site.getSiteId());
                }
            } catch (Exception e) {
                log.error("QueueScheduler: Error scheduling requests for site ID {}: {}", site.getSiteId(), e.getMessage());
            }
        }
    }
}

