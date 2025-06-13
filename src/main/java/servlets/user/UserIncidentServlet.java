package servlets.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import database.tables.EditUsersTable;
import mainClasses.Incident;
import mainClasses.User;
import servlets.BaseServlet;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

public class UserIncidentServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session
        if (!checkSession(request, response, "userRole", "REGULAR_USER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get all incidents from database
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();
            ArrayList<Incident> incidents = editIncidentsTable.databaseToIncidents();

            // Convert to JSON array
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(incidents);

            // Send response
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);
            out.flush();

        } catch (Exception e) {
            // Handle database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching incidents\"}");
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session
        if (!checkSession(request, response, "userRole", "REGULAR_USER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get logged in username from session
            HttpSession session = request.getSession(false);
            String loggedInUsername = (String) session.getAttribute("loggedInUserUsername");

            // Get user's phone number from profile
            EditUsersTable editUsersTable = new EditUsersTable();
            User currentUser = editUsersTable.getUserByUsernameFromDB(loggedInUsername);

            if (currentUser == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"User profile not found\"}");
                out.flush();
                return;
            }

            // Read JSON payload
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON to Incident object
            Gson gson = new Gson();
            Incident incidentData = gson.fromJson(jsonBuffer.toString(), Incident.class);

            // Create new incident with proper values
            Incident newIncident = new Incident();
            newIncident.setIncident_type(incidentData.getIncident_type());
            newIncident.setDescription(incidentData.getDescription());
            newIncident.setUser_phone(currentUser.getTelephone());
            newIncident.setUser_type("user");
            newIncident.setAddress(incidentData.getAddress());
            newIncident.setLat(incidentData.getLat());
            newIncident.setLon(incidentData.getLon());
            newIncident.setMunicipality(incidentData.getMunicipality());
            newIncident.setPrefecture(incidentData.getPrefecture());
            newIncident.setStart_datetime();
            newIncident.setStatus("running");
            newIncident.setDanger(incidentData.getDanger());

            // Optional fields
            if (incidentData.getFinalResult() != null) {
                newIncident.setFinalResult(incidentData.getFinalResult());
            }
            if (incidentData.getVehicles() > 0) {
                newIncident.setVehicles(incidentData.getVehicles());
            }
            if (incidentData.getFiremen() > 0) {
                newIncident.setFiremen(incidentData.getFiremen());
            }

            // Save incident to database
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();
            editIncidentsTable.createNewIncident(newIncident);

            // Send success response
            response.setStatus(HttpServletResponse.SC_CREATED);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": true, \"message\": \"Incident submitted\"}");
            out.flush();

        } catch (Exception e) {
            // Handle JSON parsing or database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing request\"}");
            out.flush();
        }
    }
}