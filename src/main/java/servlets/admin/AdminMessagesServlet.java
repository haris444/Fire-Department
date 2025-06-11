package servlets.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.EditMessagesTable;
import mainClasses.Message;
import servlets.BaseServlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
            ArrayList<Message> messages;

            // Check if incident_id parameter is provided
            String incidentIdParam = request.getParameter("incident_id");
            if (incidentIdParam != null) {
                int incidentId = Integer.parseInt(incidentIdParam);
                messages = editMessagesTable.databaseToMessage(incidentId);
            } else {
                messages = editMessagesTable.getAllMessages();
            }

            // Convert to JSON
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(messages);

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

            // Create Message object
            Message message = new Message();
            message.setSender("admin");
            message.setMessage(messageRequest.message_text);
            message.setRecipient(messageRequest.recipient);

            // Set incident_id if provided
            if (messageRequest.incident_id != null) {
                message.setIncident_id(messageRequest.incident_id);
            }

            message.setDate_time();

            // Save message to database
            EditMessagesTable editMessagesTable = new EditMessagesTable();
            editMessagesTable.createNewMessage(message);

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
        Integer incident_id;
        String message_text;
        String recipient;
    }
}