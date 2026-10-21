package com.ritesh.disastermanagement.config;

import com.ritesh.disastermanagement.dto.ResponseTeamRequestDTO;
import com.ritesh.disastermanagement.entity.ResponseTeam;
import com.ritesh.disastermanagement.entity.TeamMember;
import com.ritesh.disastermanagement.repository.ResponseTeamRepository;
import com.ritesh.disastermanagement.repository.TeamMemberRepository;
import com.ritesh.disastermanagement.service.ResponseTeamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;

@Component
public class ResponseTeamDatabaseSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ResponseTeamDatabaseSeeder.class);
    private static final String DEFAULT_TEAM_NAME = "Station 1 Fire & Rescue Engine";

    private final DataSource dataSource;
    private final ResponseTeamRepository responseTeamRepository;
    private final ResponseTeamService responseTeamService;
    private final TeamMemberRepository teamMemberRepository;

    @Value("${app.seeder.seed-members:true}")
    private boolean seedMembers;

    public ResponseTeamDatabaseSeeder(DataSource dataSource,
                                     ResponseTeamRepository responseTeamRepository,
                                     ResponseTeamService responseTeamService,
                                     TeamMemberRepository teamMemberRepository) {
        this.dataSource = dataSource;
        this.responseTeamRepository = responseTeamRepository;
        this.responseTeamService = responseTeamService;
        this.teamMemberRepository = teamMemberRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection()) {
            String url = connection.getMetaData().getURL();
            log.info("Active datasource: {}", url);
        } catch (SQLException ex) {
            log.warn("Unable to read active datasource metadata: {}", ex.getMessage());
        }

        ResponseTeam team = responseTeamRepository.findByNameIgnoreCase(DEFAULT_TEAM_NAME).orElse(null);
        if (team == null) {
            ResponseTeamRequestDTO request = new ResponseTeamRequestDTO();
            request.setName(DEFAULT_TEAM_NAME);
            request.setSpecialization("Fire suppression");
            request.setAvailable(true);
            responseTeamService.createTeam(request);
            team = responseTeamRepository.findByNameIgnoreCase(DEFAULT_TEAM_NAME).orElseThrow();
            log.info("Seeded default response team '{}' into the active database.", DEFAULT_TEAM_NAME);
        } else {
            log.info("Response team '{}' already exists in the active database.", DEFAULT_TEAM_NAME);
        }

        if (seedMembers && teamMemberRepository.count() == 0) {
            TeamMember member1 = new TeamMember();
            member1.setName("Officer Verma");
            member1.setRole("Lead Responder");
            member1.setContactInfo("verma@emergency.gov");
            member1.setAvailable(true);
            member1.setTeam(team);
            member1.setLastLatitude(28.6139);
            member1.setLastLongitude(77.2090);
            member1.setLastAccuracy(5.0);
            member1.setLastLocationAt(Instant.now());
            member1.setLocationStatus("ONLINE");
            teamMemberRepository.save(member1);

            TeamMember member2 = new TeamMember();
            member2.setName("Officer Sharma");
            member2.setRole("Emergency Paramedic");
            member2.setContactInfo("sharma@emergency.gov");
            member2.setAvailable(true);
            member2.setTeam(team);
            member2.setLastLatitude(28.6250);
            member2.setLastLongitude(77.2150);
            member2.setLastAccuracy(6.0);
            member2.setLastLocationAt(Instant.now());
            member2.setLocationStatus("ONLINE");
            teamMemberRepository.save(member2);

            log.info("Seeded default responders 'Officer Verma' (#1) and 'Officer Sharma' (#2) into the database.");
        }
    }
}
