package servlets.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.EditMessagesTable;
import database.tables.EditIncidentsTable;
import mainClasses.Message;
import mainClasses.Incident;
import servlets.BaseServlet;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

public class UserMessageServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session
        if (!checkSession(request, response, "userRole", "REGULAR_USER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            EditMessagesTable editMessagesTable = new EditMessagesTable();
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();

            // Get only public messages for regular users
            ArrayList<Message> publicMessages = editMessagesTable.getMessagesByRecipient("public");

            // Get all incidents for the incident dropdown (when sending to admin)
            ArrayList<Incident> incidents = editIncidentsTable.databaseToIncidents();

            // Create response object with both messages and incidents
            UserMessagesResponse responseObj = new UserMessagesResponse();
            responseObj.messages = publicMessages;
            responseObj.incidents = incidents;

            // Convert to JSON
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(responseObj);

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
        if (!checkSession(request, response, "userRole", "REGULAR_USER")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get logged in username from session (this is the sender)
            HttpSession session = request.getSession(false);
            String loggedInUsername = (String) session.getAttribute("loggedInUsername");

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
                out.print("{\"success\": false, \"message\": \"Invalid recipient. Users can send to 'admin' or 'public' only.\"}");
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

            // For messages to admin, incident_id is required
            if ("admin".equals(messageRequest.recipient)) {
                if (messageRequest.incident_id == null || messageRequest.incident_id <= 0) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    PrintWriter out = response.getWriter();
                    out.print("{\"success\": false, \"message\": \"Incident ID is required when sending messages to admin.\"}");
                    out.flush();
                    return;
                }
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
                // For public messages, set a default incident_id or use 1
                newMessage.setIncident_id(1);
            }

            // Set current date/time
            newMessage.setDate_time();

            // Save message to database
            EditMessagesTable editMessagesTable = new EditMessagesTable();
            editMessagesTable.createNewMessage(newMessage);

            // Send success response
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": true, \"message\": \"Message sent successfully\"}");
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

    // Inner class for response structure that includes both messages and incidents
    private static class UserMessagesResponse {
        ArrayList<Message> messages;
        ArrayList<Incident> incidents;
    }
}