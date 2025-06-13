package servlets.volunteer;

import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import database.tables.EditParticipantsTable;
import database.tables.EditUsersTable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import mainClasses.Incident;
import servlets.BaseServlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.util.ArrayList;

/**
 * Servlet to handle fetching incidents for a volunteer.
 * TEMPORARILY MODIFIED: This servlet now fetches ALL incidents, not just those
 * assigned to the volunteer, until participant functionality is fully implemented.
 */
public class VolunteerIncidentServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "userRole", "VOLUNTEER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String requestType = request.getParameter("type"); // "all" or "assigned"

        HttpSession session = request.getSession(false);
        String volunteerUsername = (String) session.getAttribute("loggedInUsername");

        try (PrintWriter out = response.getWriter()) {
            EditIncidentsTable incidentsTable = new EditIncidentsTable();
            ArrayList<Incident> incidents;

            if ("assigned".equals(requestType)) {
                EditUsersTable usersTable = new EditUsersTable();
                int volunteerUserId = usersTable.getUserIdByUsername(volunteerUsername);
                if (volunteerUserId == -1) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"success\": false, \"message\": \"Volunteer not found\"}");
                    return;
                }
                incidents = incidentsTable.getIncidentsByVolunteerId(volunteerUserId);
            } else {
                incidents = incidentsTable.databaseToIncidents();
            }

            Gson gson = new Gson();
            String jsonResponse = gson.toJson(incidents);
            response.setStatus(HttpServletResponse.SC_OK);
            out.print(jsonResponse);

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Database error occurred.\"}");
            e.printStackTrace();
        }
    }
}
