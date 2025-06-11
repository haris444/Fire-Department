package servlets.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import database.tables.EditUsersTable;
import database.tables.EditVolunteersTable;
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
            EditUsersTable editUsersTable = new EditUsersTable();
            EditVolunteersTable editVolunteersTable = new EditVolunteersTable();

            // Fetch statistics data
            ArrayList<HashMap<String, Object>> incidentsByType = editIncidentsTable.countIncidentsByType();
            int userCount = getUserCount();
            int volunteerCount = getVolunteerCount();
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

    private int getUserCount() throws Exception {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM users");
        int count = 0;
        if (rs.next()) {
            count = rs.getInt("count");
        }

        stmt.close();
        con.close();
        return count;
    }

    private int getVolunteerCount() throws Exception {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM volunteers");
        int count = 0;
        if (rs.next()) {
            count = rs.getInt("count");
        }

        stmt.close();
        con.close();
        return count;
    }
}