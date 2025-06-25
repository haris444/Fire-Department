package servlets;

import com.google.gson.Gson;
import database.tables.IncidentsTable;
import mainClasses.Incident;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

/**
 * Simple servlet for guest users to view active incidents.
 * No authentication required - provides read-only access to incident data.
 */
public class GuestIncidentsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            // Get all incidents from database
            IncidentsTable incidentsTable = new IncidentsTable();
            ArrayList<Incident> allIncidents = incidentsTable.getAllIncidents();

            // Filter for active incidents only (running or submitted status)
            ArrayList<Incident> activeIncidents = new ArrayList<>();
            if (allIncidents != null) {
                for (Incident incident : allIncidents) {
                    if ("running".equalsIgnoreCase(incident.getStatus()) ||
                            "submitted".equalsIgnoreCase(incident.getStatus())) {
                        activeIncidents.add(incident);
                    }
                }
            }

            // Convert to JSON and send response
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(activeIncidents);

            response.setStatus(HttpServletResponse.SC_OK);
            out.print(jsonResponse);

        } catch (Exception e) {
            // Handle any errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\": \"Unable to load incidents at this time\"}");

            // Log error for debugging
            System.err.println("Error in GuestIncidentsServlet: " + e.getMessage());
            e.printStackTrace();
        } finally {
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            // Read JSON payload from request body
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON to get incident data
            Gson gson = new Gson();
            Incident incidentData = gson.fromJson(jsonBuffer.toString(), Incident.class);

            // Validate required fields
            if (incidentData.getIncident_type() == null || incidentData.getIncident_type().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Incident type is required\"}");
                return;
            }

            if (incidentData.getDescription() == null || incidentData.getDescription().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Description is required\"}");
                return;
            }

            if (incidentData.getUser_phone() == null || incidentData.getUser_phone().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Phone number is required\"}");
                return;
            }

            if (incidentData.getAddress() == null || incidentData.getAddress().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Address is required\"}");
                return;
            }

            if (incidentData.getMunicipality() == null || incidentData.getMunicipality().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Municipality is required\"}");
                return;
            }

            if (incidentData.getPrefecture() == null || incidentData.getPrefecture().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Prefecture is required\"}");
                return;
            }

            // Create new incident with guest data
            Incident newIncident = new Incident();
            newIncident.setIncident_type(incidentData.getIncident_type().trim());
            newIncident.setDescription(incidentData.getDescription().trim());
            newIncident.setUser_phone(incidentData.getUser_phone().trim());
            newIncident.setUser_type("guest");
            newIncident.setAddress(incidentData.getAddress().trim());
            newIncident.setMunicipality(incidentData.getMunicipality().trim());
            newIncident.setPrefecture(incidentData.getPrefecture().trim());
            newIncident.setStart_datetime();
            newIncident.setStatus("submitted");
            newIncident.setDanger("unknown");

            // Validate and set coordinates if provided
            if (incidentData.getLat() != 0.0 && incidentData.getLon() != 0.0) {
                if (isValidCreteCoordinates(incidentData.getLat(), incidentData.getLon())) {
                    newIncident.setLat(incidentData.getLat());
                    newIncident.setLon(incidentData.getLon());
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\": false, \"message\": \"Invalid coordinates for Crete region\"}");
                    return;
                }
            }

            // Save incident to database
            IncidentsTable incidentsTable = new IncidentsTable();
            incidentsTable.createNewIncident(newIncident);

            // Send success response
            response.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"success\": true, \"message\": \"Incident submitted successfully\"}");

        } catch (Exception e) {
            // Handle any errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\": false, \"message\": \"Error submitting incident: " + e.getMessage() + "\"}");

            // Log error for debugging
            System.err.println("Error in GuestIncidentServlet: " + e.getMessage());
            e.printStackTrace();
        } finally {
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