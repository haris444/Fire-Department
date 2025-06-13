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
 * Servlet to handle messaging for volunteers according to project rules.
 * Volunteers can:
 * - Send messages to: admin, public, volunteers (with incident_id)
 * - Read messages from: admin and volunteers for incidents they participate in, plus all public messages
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
            int volunteerUserId = usersTable.getUserIdByUsername(volunteerUsername);
            if (volunteerUserId == -1) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"success\": false, \"message\": \"Volunteer not found\"}");
                return;
            }

            // Get incidents this volunteer is assigned to
            ArrayList<Integer> assignedIncidentIds = assignmentsTable.getAssignedIncidentIds(volunteerUserId);

            // Get messages according to the rules
            ArrayList<Message> messages = getVolunteerMessages(messagesTable, volunteerUsername, assignedIncidentIds);

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

            // Validate incident_id is provided (always required for volunteers)
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

            // Verify the volunteer is assigned to this incident
            EditUsersTable usersTable = new EditUsersTable();
            EditVolunteerAssignmentsTable assignmentsTable = new EditVolunteerAssignmentsTable();

            int volunteerUserId = usersTable.getUserIdByUsername(senderUsername);
            ArrayList<Integer> assignedIncidentIds = assignmentsTable.getAssignedIncidentIds(volunteerUserId);

            if (!assignedIncidentIds.contains(messageRequest.incident_id)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                out.print("{\"success\": false, \"message\": \"You can only send messages for incidents you are assigned to.\"}");
                return;
            }

            // Create and save the message
            Message newMessage = new Message();
            newMessage.setSender(senderUsername);
            newMessage.setRecipient(recipient);
            newMessage.setMessage(messageRequest.message_text);
            newMessage.setIncident_id(messageRequest.incident_id);
            newMessage.setDate_time(); // Set current timestamp

            EditMessagesTable messagesTable = new EditMessagesTable();
            messagesTable.createNewMessage(newMessage);

            response.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"success\": true, \"message\": \"Message sent successfully.\"}");

        } catch (ClassNotFoundException | SQLException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error sending message.\"}");
            e.printStackTrace();
        }
    }

    /**
     * Gets messages that a volunteer should be able to read according to the rules:
     * - Messages from admin and volunteers for incidents they participate in
     * - All public messages
     *
     * @param messagesTable The messages table handler
     * @param volunteerUsername The volunteer's username
     * @param assignedIncidentIds List of incident IDs the volunteer is assigned to
     * @return List of messages the volunteer can read
     */
    private ArrayList<Message> getVolunteerMessages(EditMessagesTable messagesTable,
                                                    String volunteerUsername, ArrayList<Integer> assignedIncidentIds)
            throws SQLException, ClassNotFoundException {

        ArrayList<Message> allMessages = messagesTable.getAllMessages();
        ArrayList<Message> filteredMessages = new ArrayList<>();

        for (Message message : allMessages) {
            // Always include public messages
            if ("public".equals(message.getRecipient())) {
                filteredMessages.add(message);
                continue;
            }

            // Include messages where volunteer is the recipient for their assigned incidents
            if (volunteerUsername.equals(message.getRecipient()) &&
                    assignedIncidentIds.contains(message.getIncident_id())) {
                filteredMessages.add(message);
                continue;
            }

            // Include messages to "volunteers" for incidents they're assigned to
            if ("volunteers".equals(message.getRecipient()) &&
                    assignedIncidentIds.contains(message.getIncident_id())) {
                filteredMessages.add(message);
                continue;
            }

            // Include messages from admin for incidents they're assigned to
            if ("admin".equals(message.getSender()) &&
                    assignedIncidentIds.contains(message.getIncident_id())) {
                filteredMessages.add(message);
                continue;
            }
        }

        return filteredMessages;
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