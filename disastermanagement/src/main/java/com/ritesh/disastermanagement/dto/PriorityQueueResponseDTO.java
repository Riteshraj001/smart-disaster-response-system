package com.ritesh.disastermanagement.dto;

import java.util.List;

/** Unresolved work ordered by severity; critical incidents are separately surfaced for dispatch dashboards. */
public record PriorityQueueResponseDTO(int unresolvedCriticalCount,
                                       List<IncidentResponseDTO> unresolvedCriticalIncidents,
                                       List<IncidentResponseDTO> incidents) { }
