package servlets.volunteer;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import database.tables.EditIncidentsTable;
import database.tables.EditUsersTable;
import database.tables.EditVolunteerAssignmentsTable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import mainClasses.Incident;
import servlets.BaseServlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

/**
 * Servlet to handle incidents for volunteers.
 * Supports both viewing all incidents and managing volunteer assignments.
 */
public class VolunteerIncidentServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "userRole", "VOLUNTEER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String requestType = request.getParameter("type"); // "all" or "assigned"

        HttpSession session = request.getSession(false);
        String volunteerUsername = (String) session.getAttribute("loggedInUsername");

        try (PrintWriter out = response.getWriter()) {
            EditIncidentsTable incidentsTable = new EditIncidentsTable();
            ArrayList<Incident> incidents;

            if ("assigned".equals(requestType)) {
                // Get only incidents assigned to this volunteer
                EditUsersTable usersTable = new EditUsersTable();
                int volunteerUserId = usersTable.getUserIdByUsername(volunteerUsername);
                if (volunteerUserId == -1) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"success\": false, \"message\": \"Volunteer not found\"}");
                    return;
                }
                incidents = incidentsTable.getIncidentsByVolunteerId(volunteerUserId);
            } else {
                // Get all incidents (default behavior)
                incidents = incidentsTable.databaseToIncidents();
            }

            Gson gson = new Gson();
            String jsonResponse = gson.toJson(incidents);
            response.setStatus(HttpServletResponse.SC_OK);
            out.print(jsonResponse);

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Database error occurred.\"}");
            e.printStackTrace();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "userRole", "VOLUNTEER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        String volunteerUsername = (String) session.getAttribute("loggedInUsername");

        StringBuilder jsonBuffer = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }
        }

        try (PrintWriter out = response.getWriter()) {
            Gson gson = new Gson();
            JsonObject requestData = new JsonParser().parse(jsonBuffer.toString()).getAsJsonObject();

            String action = requestData.get("action").getAsString();
            int incidentId = requestData.get("incident_id").getAsInt();

            EditUsersTable usersTable = new EditUsersTable();
            int volunteerUserId = usersTable.getUserIdByUsername(volunteerUsername);

            if (volunteerUserId == -1) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"success\": false, \"message\": \"Volunteer not found\"}");
                return;
            }

            EditVolunteerAssignmentsTable assignmentsTable = new EditVolunteerAssignmentsTable();

            if ("apply".equals(action)) {
                // Volunteer wants to apply to an incident
                boolean success = assignmentsTable.assignVolunteerToIncident(volunteerUserId, incidentId);

                if (success) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"success\": true, \"message\": \"Successfully applied to incident\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"success\": false, \"message\": \"You are already assigned to this incident\"}");
                }

            } else if ("leave".equals(action)) {
                // Volunteer wants to leave an incident assignment
                boolean success = assignmentsTable.removeAssignment(volunteerUserId, incidentId);

                if (success) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"success\": true, \"message\": \"Successfully left incident assignment\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"success\": false, \"message\": \"Assignment not found\"}");
                }

            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"sccess\": false, \"message\": \"Invalid action. Use 'apply' or 'leave'\"}");
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing request: " + e.getMessage() + "\"}");
            e.printStackTrace();
        }
    }
}