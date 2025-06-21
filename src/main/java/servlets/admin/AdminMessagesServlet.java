package servlets.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

public class AdminMessagesServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check admin session
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            EditMessagesTable editMessagesTable = new EditMessagesTable();
            EditIncidentsTable editIncidentsTable = new EditIncidentsTable();

            // Admin can see all messages
            ArrayList<Message> messages = editMessagesTable.getAllMessages();

            // Get all incidents for the incident dropdown
            ArrayList<Incident> incidents = editIncidentsTable.databaseToIncidents();

            // Create response object with both messages and incidents
            AdminMessagesResponse responseObj = new AdminMessagesResponse();
            responseObj.messages = messages;
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
            out.print("{\"success\": false, \"message\": \"Error fetching messages: " + e.getMessage() + "\"}");
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check admin session
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
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

            // Validate required fields
            if (messageRequest.message_text == null || messageRequest.message_text.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Message text is required.\"}");
                out.flush();
                return;
            }

            if (messageRequest.incident_id == null || messageRequest.incident_id <= 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Incident ID is required for all messages.\"}");
                out.flush();
                return;
            }

            if (messageRequest.recipient == null || messageRequest.recipient.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Recipient is required.\"}");
                out.flush();
                return;
            }

            // Validate recipient type - admin can only send to public or volunteers
            if (!"public".equals(messageRequest.recipient) && !"volunteers".equals(messageRequest.recipient)) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Admin can only send to 'public' or 'volunteers'.\"}");
                out.flush();
                return;
            }

            // Create Message object
            Message message = new Message();
            message.setSender("admin");
            message.setMessage(messageRequest.message_text);
            message.setRecipient(messageRequest.recipient);
            message.setIncident_id(messageRequest.incident_id);
            message.setDate_time();

            // Save message to database
            EditMessagesTable editMessagesTable = new EditMessagesTable();
            editMessagesTable.createNewMessage(message);

            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": true, \"message\": \"Message sent successfully\"}");
            out.flush();

        } catch (Exception e) {
            // Handle JSON parsing or database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing request: " + e.getMessage() + "\"}");
            out.flush();
        }
    }

    // Inner class for JSON parsing of message requests
    private static class MessageRequest {
        String message_text;
        String recipient;
        Integer incident_id;
    }

    // Inner class for response structure that includes both messages and incidents
    private static class AdminMessagesResponse {
        ArrayList<Message> messages;
        ArrayList<Incident> incidents;
    }
}