package servlets;

import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import mainClasses.Incident;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;



public class GuestIncidentServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            // Read JSON from request body
            StringBuilder jsonBuffer = new StringBuilder();
            String line;
            BufferedReader reader = request.getReader();
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }
            String jsonString = jsonBuffer.toString();

            // Convert JSON to Incident object
            Gson gson = new Gson();
            Incident incident = gson.fromJson(jsonString, Incident.class);

            // Set guest-specific fields
            incident.setUser_type("guest");
            incident.setStatus("submitted");
            incident.setStart_datetime(); // This will set current timestamp

            // Save to database
            EditIncidentsTable editTable = new EditIncidentsTable();
            editTable.createNewIncident(incident);

            // Return success response
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("success", true);
            responseMap.put("message", "Incident submitted successfully");
            responseMap.put("incident_id", incident.getIncident_id());

            String jsonResponse = gson.toJson(responseMap);
            out.print(jsonResponse);

        } catch (Exception e) {
            // Return error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error submitting incident: " + e.getMessage());

            Gson gson = new Gson();
            String jsonResponse = gson.toJson(errorResponse);
            out.print(jsonResponse);

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        } finally {
            out.flush();
        }
    }
}