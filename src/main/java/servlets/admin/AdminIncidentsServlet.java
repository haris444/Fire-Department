package servlets.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import database.tables.EditIncidentsTable;
import mainClasses.Incident;
import servlets.BaseServlet;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class AdminIncidentsServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();
            ArrayList<Incident> incidents = editIncidentsTable.databaseToIncidents();

            Gson gson = new Gson();
            String jsonResponse = gson.toJson(incidents);

            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);
            out.flush();

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching incidents\"}");
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
            // Read JSON payload
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON - frontend sends: incident_id, incident_type, description, status, danger, vehicles
            Gson gson = new Gson();
            Type mapType = new TypeToken<Map<String, Object>>(){}.getType();
            Map<String, Object> requestData = gson.fromJson(jsonBuffer.toString(), mapType);

            // Extract incident ID
            String incidentId = String.valueOf(requestData.get("incident_id"));

            // Build updates - convert everything to string
            HashMap<String, String> updates = new HashMap<>();
            updates.put("incident_type", String.valueOf(requestData.get("incident_type")));
            updates.put("description", String.valueOf(requestData.get("description")));
            updates.put("status", String.valueOf(requestData.get("status")));
            updates.put("danger", String.valueOf(requestData.get("danger")));
            updates.put("vehicles", String.valueOf(requestData.get("vehicles")));

            // Update incident
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();
            editIncidentsTable.updateIncident(incidentId, updates);

            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": true, \"message\": \"Incident updated successfully\"}");
            out.flush();

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing request\"}");
            out.flush();
        }
    }
}