package servlets.admin;

import database.tables.EditUsersTable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import servlets.BaseServlet;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * AdminStatisticsServlet
 *
 * Returns comprehensive statistics for the admin dashboard:
 * - Incidents by type
 * - Total user count
 * - Total volunteer count
 * - Total vehicle count
 * - Total number of volunteers per incident type
 */
public class AdminStatisticsServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check admin session
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Initialize database table objects
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();

            // Fetch all required statistics
            ArrayList<HashMap<String, Object>> incidentsByType = editIncidentsTable.countIncidentsByType();
            EditUsersTable usersTable = new EditUsersTable();
            EditIncidentsTable incidentsTable = new EditIncidentsTable();
            int totalVehicleCount = incidentsTable.getTotalVehiclesInvolved();
            int volunteerCount = usersTable.getVolunteerCount();
            int userCount = usersTable.getUserCount(); // simple user NOT combined with volunteer


            // Construct statistics object
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("incidentsByType", incidentsByType);
            statistics.put("userCount", userCount);
            statistics.put("volunteerCount", volunteerCount);
            statistics.put("totalVehicleCount", totalVehicleCount);

            // Convert to JSON
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(statistics);

            // Send response
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);
            out.flush();

        } catch (Exception e) {
            // Handle database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching statistics: " + e.getMessage() + "\"}");
            out.flush();
        }
    }





}