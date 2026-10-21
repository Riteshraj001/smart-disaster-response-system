package com.ritesh.disastermanagement.controller;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.service.TrackingService;
import com.ritesh.disastermanagement.service.DispatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*")
public class TrackingController {
    private final TrackingService service;
    private final DispatchService dispatch;

    public TrackingController(TrackingService service, DispatchService dispatch) {
        this.service = service;
        this.dispatch = dispatch;
    }

    @PostMapping("/responder/location")
    public LocationUpdateResponseDTO updateResponderLocation(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody LocationUpdateRequestDTO request) {
        return service.updateResponder(authorization, request);
    }

    @GetMapping("/responder/offers")
    public List<DispatchOfferResponseDTO> responderOffers(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return dispatch.responderOffers(authorization);
    }

    @PostMapping("/responder/offers/{offerId}/accept")
    public DispatchOfferResponseDTO acceptOffer(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long offerId) {
        return dispatch.accept(authorization, offerId);
    }

    @PostMapping("/responder/offers/{offerId}/decline")
    public DispatchOfferResponseDTO declineOffer(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long offerId,
            @RequestBody(required = false) OfferDecisionRequestDTO request) {
        return dispatch.decline(authorization, offerId, request);
    }

    @GetMapping("/responder/assignments")
    public List<IncidentResponseDTO> responderAssignments(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return service.responderAssignments(authorization);
    }

    @GetMapping("/responder/identity")
    public ResponderIdentityResponseDTO responderIdentity(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return service.responderIdentity(authorization);
    }

    @GetMapping("/responder/location")
    public LocationUpdateResponseDTO responderLocation(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return service.responderLocation(authorization);
    }

    @PostMapping("/responder/location/stop")
    public LocationUpdateResponseDTO stopResponder(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return service.stopResponder(authorization);
    }

    @PostMapping("/vehicles/register")
    public ResponseEntity<VehicleRegistrationResponseDTO> registerVehicle(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registerVehicle(authorization));
    }

    @PostMapping("/vehicle/location")
    public LocationUpdateResponseDTO updateVehicleLocation(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody LocationUpdateRequestDTO request) {
        return service.updateVehicle(authorization, request);
    }

    @GetMapping("/vehicle/location")
    public LocationUpdateResponseDTO vehicleLocation(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return service.vehicleLocation(authorization);
    }

    @PostMapping("/vehicle/location/stop")
    public LocationUpdateResponseDTO stopVehicle(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return service.stopVehicle(authorization);
    }

    @GetMapping("/incidents/{incidentId}")
    public IncidentResponseDTO citizenTracking(
            @PathVariable Long incidentId,
            @RequestHeader(value = "X-Incident-Tracking-Token", required = false) String incidentToken) {
        return service.citizenTracking(incidentId, incidentToken);
    }
}
