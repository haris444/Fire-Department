package servlets.admin;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import database.tables.VolunteerAssignmentsTable;
import database.tables.IncidentsTable;
import database.tables.UsersTable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import mainClasses.VolunteerAssignment;
import mainClasses.Incident;
import mainClasses.User;
import servlets.BaseServlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;

public class AdminAssignmentsServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            VolunteerAssignmentsTable assignmentsTable = new VolunteerAssignmentsTable();
            IncidentsTable incidentsTable = new IncidentsTable();
            UsersTable usersTable = new UsersTable();

            // Get all assignments with details
            ArrayList<HashMap<String, Object>> assignments = assignmentsTable.getAllAssignmentsWithDetails();

            // Get all incidents for the dropdown
            ArrayList<Incident> incidents = incidentsTable.getAllIncidents();

            // Get all volunteers for the dropdown
            ArrayList<User> volunteers = usersTable.getAllVolunteers();

            // Create response object that includes assignments, incidents, and volunteers
            HashMap<String, Object> responseData = new HashMap<>();
            responseData.put("assignments", assignments);
            responseData.put("incidents", incidents);
            responseData.put("volunteers", volunteers);

            Gson gson = new Gson();
            String jsonResponse = gson.toJson(responseData);

            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);
            out.flush();

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching assignments\"}");
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            Gson gson = new Gson();
            JsonObject requestData = new JsonParser().parse(jsonBuffer.toString()).getAsJsonObject();

            String action = requestData.get("action").getAsString();
            VolunteerAssignmentsTable assignmentsTable = new VolunteerAssignmentsTable();

            if ("assign".equals(action)) {
                int volunteerUserId = requestData.get("volunteer_user_id").getAsInt();
                int incidentId = requestData.get("incident_id").getAsInt();

                boolean success = assignmentsTable.createNewAssignment(new VolunteerAssignment(volunteerUserId, incidentId));

                response.setStatus(HttpServletResponse.SC_OK);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": " + success + ", \"message\": \"" +
                        (success ? "Assignment created" : "Assignment already exists") + "\"}");
                out.flush();

            } else if ("remove".equals(action)) {
                int volunteerUserId = requestData.get("volunteer_user_id").getAsInt();
                int incidentId = requestData.get("incident_id").getAsInt();

                boolean success = assignmentsTable.removeAssignment(volunteerUserId, incidentId);

                response.setStatus(HttpServletResponse.SC_OK);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": " + success + ", \"message\": \"" +
                        (success ? "Assignment removed" : "Assignment not found") + "\"}");
                out.flush();
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing request\"}");
            out.flush();
        }
    }
}