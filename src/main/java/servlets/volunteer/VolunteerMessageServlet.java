package servlets.volunteer;

import com.google.gson.Gson;
import database.tables.MessagesTable;
import database.tables.UsersTable;
import database.tables.VolunteerAssignmentsTable;
import database.tables.IncidentsTable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import mainClasses.Message;
import mainClasses.Incident;
import servlets.BaseServlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;

/**
 * Updated servlet to handle messaging for volunteers with restricted volunteer messaging.
 * Volunteers can only send messages to other volunteers for incidents they are assigned to.
 */
public class VolunteerMessageServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "userRole", "VOLUNTEER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        String volunteerUsername = (String) session.getAttribute("loggedInUsername");

        try (PrintWriter out = response.getWriter()) {
            MessagesTable messagesTable = new MessagesTable();
            UsersTable usersTable = new UsersTable();
            VolunteerAssignmentsTable assignmentsTable = new VolunteerAssignmentsTable();
            IncidentsTable incidentsTable = new IncidentsTable();

            // Get volunteer's user ID
            int volunteerUserId = usersTable.getUserByUsername(volunteerUsername).getUser_id();

            // Get incidents this volunteer is assigned to
            ArrayList<Integer> assignedIncidentIds = assignmentsTable.getAssignedIncidentIds(volunteerUserId);

            // Get messages according to the rules
            ArrayList<Message> messages = messagesTable.getMessagesForVolunteer(assignedIncidentIds);

            // Get all incidents for the dropdown
            ArrayList<Incident> allIncidents = incidentsTable.getAllIncidents();

            // Create response object with messages, incidents, incident info, and assigned incident IDs
            VolunteerMessagesResponse responseObj = new VolunteerMessagesResponse();
            responseObj.messages = messages;
            responseObj.incidents = allIncidents;
            responseObj.incident_info = createIncidentInfoMap(allIncidents);
            responseObj.assigned_incident_ids = assignedIncidentIds; // NEW: Add assigned incident IDs

            Gson gson = new Gson();
            String jsonResponse = gson.toJson(responseObj);
            response.setStatus(HttpServletResponse.SC_OK);
            out.print(jsonResponse);

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching messages.\"}");
            e.printStackTrace();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!checkSession(request, response, "userRole", "VOLUNTEER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        String senderUsername = (String) session.getAttribute("loggedInUsername");

        StringBuilder jsonBuffer = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }
        }

        try (PrintWriter out = response.getWriter()) {
            Gson gson = new Gson();
            MessageRequest messageRequest = gson.fromJson(jsonBuffer.toString(), MessageRequest.class);

            // Validate recipient
            String recipient = messageRequest.recipient;
            if (!"admin".equals(recipient) && !"public".equals(recipient) && !"volunteers".equals(recipient)) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Invalid recipient. Can only send to 'admin', 'public', or 'volunteers'.\"}");
                return;
            }

            // Validate incident_id is provided
            if (messageRequest.incident_id == null || messageRequest.incident_id <= 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Incident ID is required for all volunteer messages.\"}");
                return;
            }

            // NEW: Additional validation for volunteer messages - must be assigned to incident
            if ("volunteers".equals(recipient)) {
                UsersTable usersTable = new UsersTable();
                VolunteerAssignmentsTable assignmentsTable = new VolunteerAssignmentsTable();

                int volunteerUserId = usersTable.getUserByUsername(senderUsername).getUser_id();
                ArrayList<Integer> assignedIncidentIds = assignmentsTable.getAssignedIncidentIds(volunteerUserId);

                if (!assignedIncidentIds.contains(messageRequest.incident_id)) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"success\": false, \"message\": \"You can only send volunteer messages for incidents you are assigned to.\"}");
                    return;
                }
            }

            // Validate message text
            if (messageRequest.message_text == null || messageRequest.message_text.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Message text is required.\"}");
                return;
            }

            // Create and save the message
            Message newMessage = new Message();
            newMessage.setSender(senderUsername);
            newMessage.setRecipient(recipient);
            newMessage.setMessage(messageRequest.message_text);
            newMessage.setIncident_id(messageRequest.incident_id);
            newMessage.setDate_time();

            MessagesTable messagesTable = new MessagesTable();
            messagesTable.createNewMessage(newMessage);

            response.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"success\": true, \"message\": \"Message sent successfully.\"}");

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error sending message.\"}");
            e.printStackTrace();
        }
    }

    /**
     * Helper method to create incident info map for frontend display.
     * Returns only type, municipality, and status for each incident.
     */
    private HashMap<String, HashMap<String, String>> createIncidentInfoMap(ArrayList<Incident> incidents) {
        HashMap<String, HashMap<String, String>> incidentInfo = new HashMap<>();

        for (Incident incident : incidents) {
            HashMap<String, String> info = new HashMap<>();
            info.put("type", incident.getIncident_type());
            info.put("municipality", incident.getMunicipality());
            info.put("status", incident.getStatus());

            incidentInfo.put(String.valueOf(incident.getIncident_id()), info);
        }

        return incidentInfo;
    }

    /**
     * Inner class for JSON parsing of message requests
     */
    private static class MessageRequest {
        String recipient;
        String message_text;
        Integer incident_id;
    }

    /**
     * Inner class for response structure that includes messages, incidents, incident info, and assigned incident IDs
     */
    private static class VolunteerMessagesResponse {
        ArrayList<Message> messages;
        ArrayList<Incident> incidents;
        HashMap<String, HashMap<String, String>> incident_info;
        ArrayList<Integer> assigned_incident_ids; // NEW: Add assigned incident IDs to response
    }
}