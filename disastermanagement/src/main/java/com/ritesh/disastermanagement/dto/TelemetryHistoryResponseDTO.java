package com.ritesh.disastermanagement.dto;

import java.util.List;

public class TelemetryHistoryResponseDTO {
    private List<TelemetryReadingResponseDTO> readings;
    private int page;
    private int limit;
    private long totalElements;
    private int totalPages;

    public List<TelemetryReadingResponseDTO> getReadings() {
        return readings;
    }

    public void setReadings(List<TelemetryReadingResponseDTO> readings) {
        this.readings = readings;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
