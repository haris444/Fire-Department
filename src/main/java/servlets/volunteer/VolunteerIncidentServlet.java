package servlets.volunteer;

import com.google.gson.Gson;
import database.tables.EditIncidentsTable;
import database.tables.EditParticipantsTable;
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
        // Check for a valid volunteer session
        if (!checkSession(request, response, "userRole", "VOLUNTEER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        String volunteerUsername = (String) session.getAttribute("loggedInUsername");

        try (PrintWriter out = response.getWriter()) {
            EditIncidentsTable incidentsTable = new EditIncidentsTable();
            ArrayList<Incident> incidents;

            /*
             * === TEMPORARY CHANGE ===
             * The following lines for fetching assigned incidents are commented out.
             * Instead, we will fetch all incidents.
             */
            // EditParticipantsTable participantsTable = new EditParticipantsTable();
            // ArrayList<Integer> incidentIds = participantsTable.getIncidentIdsByVolunteer(volunteerUsername);
            //
            // if (incidentIds != null && !incidentIds.isEmpty()) {
            //     incidents = incidentsTable.getIncidentsByIds(incidentIds);
            // } else {
            //     incidents = new ArrayList<>();
            // }

            // MODIFIED: Fetch all incidents from the database.
            incidents = incidentsTable.databaseToIncidents();


            // Convert the list of incidents to JSON and send the response.
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(incidents);
            response.setStatus(HttpServletResponse.SC_OK);
            out.print(jsonResponse);

        } catch (SQLException | ClassNotFoundException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Database error occurred.\"}");
            e.printStackTrace();
        }
    }
}
