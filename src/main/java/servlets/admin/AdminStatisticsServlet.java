package servlets.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import database.DB_Connection;
import servlets.BaseServlet;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
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
            int userCount = getUserCount();
            int volunteerCount = getVolunteerCount();
            int totalVehicleCount = getTotalVehicleCount();
            ArrayList<HashMap<String, Object>> volunteersPerIncidentType = getVolunteersPerIncidentType();

            // Construct statistics object
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("incidentsByType", incidentsByType);
            statistics.put("userCount", userCount);
            statistics.put("volunteerCount", volunteerCount);
            statistics.put("totalVehicleCount", totalVehicleCount);
            statistics.put("volunteersPerIncidentType", volunteersPerIncidentType);

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

    /**
     * Counts the number of registered users (excluding volunteers and admins).
     * @return The total count of users with user_type = 'user'.
     * @throws Exception
     */
    private int getUserCount() throws Exception {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        try {
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM users WHERE user_type = 'user'");
            int count = 0;
            if (rs.next()) {
                count = rs.getInt("count");
            }
            return count;
        } finally {
            stmt.close();
            con.close();
        }
    }

    /**
     * Counts the number of registered volunteers.
     * @return The total count of users with user_type = 'volunteer'.
     * @throws Exception
     */
    private int getVolunteerCount() throws Exception {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        try {
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM users WHERE user_type = 'volunteer'");
            int count = 0;
            if (rs.next()) {
                count = rs.getInt("count");
            }
            return count;
        } finally {
            stmt.close();
            con.close();
        }
    }

    /**
     * Gets the total count of vehicles across all incidents.
     * @return The total number of vehicles involved in all incidents.
     * @throws Exception
     */
    private int getTotalVehicleCount() throws Exception {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        try {
            ResultSet rs = stmt.executeQuery("SELECT SUM(vehicles) as total FROM incidents WHERE vehicles IS NOT NULL");
            int total = 0;
            if (rs.next()) {
                total = rs.getInt("total");
            }
            return total;
        } finally {
            stmt.close();
            con.close();
        }
    }

    /**
     * Gets the number of volunteers assigned to each incident type.
     * @return ArrayList of HashMaps containing incident_type and volunteer_count.
     * @throws Exception
     */
    private ArrayList<HashMap<String, Object>> getVolunteersPerIncidentType() throws Exception {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<HashMap<String, Object>> results = new ArrayList<>();

        try {
            // Query to count volunteers per incident type using the volunteer_assignments table
            String query = "SELECT i.incident_type, COUNT(va.volunteer_user_id) as volunteer_count " +
                    "FROM incidents i " +
                    "LEFT JOIN volunteer_assignments va ON i.incident_id = va.incident_id " +
                    "GROUP BY i.incident_type " +
                    "ORDER BY i.incident_type";

            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                HashMap<String, Object> typeVolunteerCount = new HashMap<>();
                typeVolunteerCount.put("incident_type", rs.getString("incident_type"));
                typeVolunteerCount.put("volunteer_count", rs.getInt("volunteer_count"));
                results.add(typeVolunteerCount);
            }

            return results;
        } finally {
            stmt.close();
            con.close();
        }
    }
}