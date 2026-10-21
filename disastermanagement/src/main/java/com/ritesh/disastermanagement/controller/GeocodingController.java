package com.ritesh.disastermanagement.controller;

import com.ritesh.disastermanagement.dto.GeocodingResultDTO;
import com.ritesh.disastermanagement.service.GeocodingService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/geocoding")
@CrossOrigin(origins = "*")
public class GeocodingController {
    private final GeocodingService service;

    public GeocodingController(GeocodingService service) {
        this.service = service;
    }

    @GetMapping("/search")
    public List<GeocodingResultDTO> search(
            @RequestParam(name = "q") String query,
            @RequestParam(name = "limit", defaultValue = "5") int limit) {
        return service.search(query, limit);
    }
}
