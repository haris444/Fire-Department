package servlets.admin;

import servlets.admin.BaseAdminServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import database.tables.EditIncidentsTable;
import mainClasses.Incident;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class AdminIncidentsServlet extends BaseAdminServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check admin session
        if (!checkAdminSession(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Fetch all incidents from database
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();
            ArrayList<Incident> incidents = editIncidentsTable.databaseToIncidents();

            // Convert to JSON
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
        // Check admin session
        if (!checkAdminSession(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Read JSON payload
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON
            Gson gson = new Gson();
            Type mapType = new TypeToken<Map<String, Object>>(){}.getType();
            Map<String, Object> requestData = gson.fromJson(jsonBuffer.toString(), mapType);

            // Extract incident ID
            String incidentId = String.valueOf(requestData.get("incident_id"));

            // Extract updates (remove incident_id from updates map)
            HashMap<String, String> updates = new HashMap<>();
            for (Map.Entry<String, Object> entry : requestData.entrySet()) {
                if (!"incident_id".equals(entry.getKey())) {
                    updates.put(entry.getKey(), String.valueOf(entry.getValue()));
                }
            }

            // Update incident in database
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();
            editIncidentsTable.updateIncident(incidentId, updates);

            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": true, \"message\": \"Incident updated successfully\"}");
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