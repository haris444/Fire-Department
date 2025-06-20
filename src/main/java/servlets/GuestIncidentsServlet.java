package servlets;

import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import mainClasses.Incident;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();
            ArrayList<Incident> allIncidents = editIncidentsTable.databaseToIncidents();

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
}