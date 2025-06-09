package servlets.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.EditMessagesTable;
import mainClasses.Message;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

public class UserMessageServlet extends BaseUserServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session
        if (!checkUserSession(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get logged in username from session
            HttpSession session = request.getSession(false);
            String loggedInUsername = (String) session.getAttribute("loggedInUserUsername");

            // Get optional incident_id parameter
            String incidentId = request.getParameter("incident_id");

            EditMessagesTable editMessagesTable = new EditMessagesTable();

            // Get messages for user (messages to them and public messages)
            ArrayList<Message> messagesForUser = editMessagesTable.getMessagesByRecipient(loggedInUsername);
            messagesForUser.addAll(editMessagesTable.getMessagesByRecipient("public"));

            // Get messages sent by user
            ArrayList<Message> messagesSentByUser = editMessagesTable.getMessagesSentByUser(loggedInUsername);

            // Combine results and remove duplicates (if any)
            Set<Integer> messageIds = new HashSet<>();
            ArrayList<Message> allMessages = new ArrayList<>();

            allMessages.addAll(messagesForUser);

            // Convert to JSON array
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(allMessages);

            // Send response
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);
            out.flush();

        } catch (Exception e) {
            // Handle database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching messages\"}");
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session
        if (!checkUserSession(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get logged in username from session (this is the sender)
            HttpSession session = request.getSession(false);
            String loggedInUsername = (String) session.getAttribute("loggedInUserUsername");

            // Read JSON payload
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON
            Gson gson = new Gson();
            MessageRequest messageRequest = gson.fromJson(jsonBuffer.toString(), MessageRequest.class);

            // Validate recipient type (user can send to 'admin' or 'public')
            if (messageRequest.recipient == null ||
                    (!messageRequest.recipient.equals("admin") && !messageRequest.recipient.equals("public"))) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Invalid recipient. Must be 'admin' or 'public'\"}");
                out.flush();
                return;
            }

            // Validate message text
            if (messageRequest.message_text == null || messageRequest.message_text.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Message text is required\"}");
                out.flush();
                return;
            }

            // Create Message object
            Message newMessage = new Message();
            newMessage.setSender(loggedInUsername);
            newMessage.setRecipient(messageRequest.recipient);
            newMessage.setMessage(messageRequest.message_text);

            // Set incident_id if provided
            if (messageRequest.incident_id != null && messageRequest.incident_id > 0) {
                newMessage.setIncident_id(messageRequest.incident_id);
            } else {
                // Set a default incident_id if required by database (you might need to adjust this)
                newMessage.setIncident_id(1); // Assuming 1 is a valid incident_id or adjust as needed
            }

            // Set current date/time
            newMessage.setDate_time();

            // Save message to database
            EditMessagesTable editMessagesTable = new EditMessagesTable();
            editMessagesTable.createNewMessage(newMessage);

            // Send success response
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": true, \"message\": \"Message sent\"}");
            out.flush();

        } catch (Exception e) {
            // Handle JSON parsing or database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing request\"}");
            out.flush();
        }
    }

    // Inner class for JSON parsing
    private static class MessageRequest {
        String recipient;
        String message_text;
        Integer incident_id;
    }

    // Inner class for response structure
    private static class MessageResponse {
        ArrayList<Message> messagesSentByUser;
        ArrayList<Message> messagesForUser;
    }
}