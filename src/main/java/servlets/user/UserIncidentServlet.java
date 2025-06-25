package servlets.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.IncidentsTable;
import database.tables.UsersTable;
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
            IncidentsTable incidentsTable = new IncidentsTable();
            ArrayList<Incident> incidents = incidentsTable.getAllIncidents();

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
            String loggedInUsername = (String) session.getAttribute("loggedInUsername");

            // Get user's phone number from profile
            UsersTable usersTable = new UsersTable();
            User currentUser = usersTable.getUserByUsername(loggedInUsername);

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

            // Validate required fields
            if (incidentData.getIncident_type() == null || incidentData.getIncident_type().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Incident type is required\"}");
                out.flush();
                return;
            }

            if (incidentData.getDescription() == null || incidentData.getDescription().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Description is required\"}");
                out.flush();
                return;
            }

            if (incidentData.getAddress() == null || incidentData.getAddress().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Address is required\"}");
                out.flush();
                return;
            }

            if (incidentData.getMunicipality() == null || incidentData.getMunicipality().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Municipality is required\"}");
                out.flush();
                return;
            }

            if (incidentData.getPrefecture() == null || incidentData.getPrefecture().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Prefecture is required\"}");
                out.flush();
                return;
            }

            if (incidentData.getDanger() == null || incidentData.getDanger().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Danger level is required\"}");
                out.flush();
                return;
            }

            // Create new incident with proper values
            Incident newIncident = new Incident();
            newIncident.setIncident_type(incidentData.getIncident_type().trim());
            newIncident.setDescription(incidentData.getDescription().trim());
            newIncident.setUser_phone(currentUser.getTelephone());
            newIncident.setUser_type("user");
            newIncident.setAddress(incidentData.getAddress().trim());
            newIncident.setMunicipality(incidentData.getMunicipality().trim());
            newIncident.setPrefecture(incidentData.getPrefecture().trim());
            newIncident.setStart_datetime();
            newIncident.setStatus("running");
            newIncident.setDanger(incidentData.getDanger().trim());

            // Validate and set coordinates if provided
            if (incidentData.getLat() != 0.0 && incidentData.getLon() != 0.0) {
                if (isValidCreteCoordinates(incidentData.getLat(), incidentData.getLon())) {
                    newIncident.setLat(incidentData.getLat());
                    newIncident.setLon(incidentData.getLon());
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    PrintWriter out = response.getWriter();
                    out.print("{\"success\": false, \"message\": \"Invalid coordinates for Crete region\"}");
                    out.flush();
                    return;
                }
            }

            // Optional fields
            if (incidentData.getFinalResult() != null && !incidentData.getFinalResult().trim().isEmpty()) {
                newIncident.setFinalResult(incidentData.getFinalResult().trim());
            }
            if (incidentData.getVehicles() > 0) {
                newIncident.setVehicles(incidentData.getVehicles());
            }
            if (incidentData.getFiremen() > 0) {
                newIncident.setFiremen(incidentData.getFiremen());
            }

            // Save incident to database
            IncidentsTable incidentsTable = new IncidentsTable();
            incidentsTable.createNewIncident(newIncident);

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

    /**
     * Validates that coordinates are within reasonable bounds for Crete
     * @param lat Latitude
     * @param lon Longitude
     * @return true if coordinates are valid for Crete region
     */
    private boolean isValidCreteCoordinates(double lat, double lon) {
        // Approximate bounds for Crete:
        // Latitude: 34.8° to 35.7° N
        // Longitude: 23.3° to 26.3° E
        return lat >= 34.8 && lat <= 35.7 && lon >= 23.3 && lon <= 26.3;
    }
}