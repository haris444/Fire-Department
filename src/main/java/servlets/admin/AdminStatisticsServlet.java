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
 * AdminStatisticsServlet (Refactored)
 *
 * This servlet has been updated to work with the consolidated 'users' table.
 * It now correctly queries the single table to count users and volunteers
 * based on the 'user_type' field.
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

            // Fetch statistics data using updated methods
            ArrayList<HashMap<String, Object>> incidentsByType = editIncidentsTable.countIncidentsByType();
            int userCount = getUserCount(); // This now correctly counts only 'user' types
            int volunteerCount = getVolunteerCount(); // This now correctly counts 'volunteer' types
            int totalVehiclesInvolved = editIncidentsTable.getTotalVehiclesInvolved();
            int totalFiremenInvolved = editIncidentsTable.getTotalFiremenInvolved();

            // Construct statistics object
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("incidentsByType", incidentsByType);
            statistics.put("userCount", userCount);
            statistics.put("volunteerCount", volunteerCount);
            statistics.put("totalVehiclesInvolved", totalVehiclesInvolved);
            statistics.put("totalFiremenInvolved", totalFiremenInvolved);

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
            out.print("{\"success\": false, \"message\": \"Error fetching statistics\"}");
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

        // MODIFIED: Query now filters by user_type = 'user'
        ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM users WHERE user_type = 'user'");
        int count = 0;
        if (rs.next()) {
            count = rs.getInt("count");
        }

        stmt.close();
        con.close();
        return count;
    }

    /**
     * Counts the number of registered volunteers.
     * @return The total count of users with user_type = 'volunteer'.
     * @throws Exception
     */
    private int getVolunteerCount() throws Exception {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        // MODIFIED: Query now checks the consolidated 'users' table for user_type = 'volunteer'
        ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM users WHERE user_type = 'volunteer'");
        int count = 0;
        if (rs.next()) {
            count = rs.getInt("count");
        }

        stmt.close();
        con.close();
        return count;
    }
}
