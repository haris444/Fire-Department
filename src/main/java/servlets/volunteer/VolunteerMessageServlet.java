package servlets.volunteer;

import com.google.gson.Gson;
import database.tables.EditMessagesTable;
import database.tables.EditUsersTable;
import database.tables.EditVolunteerAssignmentsTable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import mainClasses.Message;
import servlets.BaseServlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import java.util.ArrayList;

/**
 * Updated servlet to handle messaging for volunteers according to new project rules.
 * Volunteers can:
 * - Send messages to: admin, public, volunteers (incident_id always required)
 * - Read messages: public messages and volunteer messages for incidents they participate in
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
            EditMessagesTable messagesTable = new EditMessagesTable();
            EditUsersTable usersTable = new EditUsersTable();
            EditVolunteerAssignmentsTable assignmentsTable = new EditVolunteerAssignmentsTable();

            // Get volunteer's user ID
            int volunteerUserId = usersTable.getUserByUsername(volunteerUsername).getUser_id();

            // Get incidents this volunteer is assigned to
            ArrayList<Integer> assignedIncidentIds = assignmentsTable.getAssignedIncidentIds(volunteerUserId);

            // Get messages according to the new rules
            ArrayList<Message> messages = messagesTable.getMessagesForVolunteer(assignedIncidentIds);

            Gson gson = new Gson();
            String jsonResponse = gson.toJson(messages);
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

            EditMessagesTable messagesTable = new EditMessagesTable();
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
     * Inner class for JSON parsing of message requests
     */
    private static class MessageRequest {
        String recipient;
        String message_text;
        Integer incident_id;
    }
}