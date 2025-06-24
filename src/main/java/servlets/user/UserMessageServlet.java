package servlets.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.MessagesTable;
import database.tables.IncidentsTable;
import mainClasses.Message;
import mainClasses.Incident;
import servlets.BaseServlet;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;

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
            MessagesTable messagesTable = new MessagesTable();
            IncidentsTable incidentsTable = new IncidentsTable();

            // Users can only see public messages
            ArrayList<Message> publicMessages = messagesTable.getPublicMessages();

            // Get all incidents for the incident dropdown (when sending to admin)
            ArrayList<Incident> incidents = incidentsTable.getAllIncidents();

            // Create response object with both messages and incidents
            UserMessagesResponse responseObj = new UserMessagesResponse();
            responseObj.messages = publicMessages;
            responseObj.incidents = incidents;
            responseObj.incident_info = createIncidentInfoMap(incidents);

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
                out.print("{\"success\": false, \"message\": \"Users can send to 'admin' or 'public' only.\"}");
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

            // Incident_id is required for all messages
            if (messageRequest.incident_id == null || messageRequest.incident_id <= 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Incident ID is required for all messages.\"}");
                out.flush();
                return;
            }

            // Create Message object
            Message newMessage = new Message();
            newMessage.setSender(loggedInUsername);
            newMessage.setRecipient(messageRequest.recipient);
            newMessage.setMessage(messageRequest.message_text);
            newMessage.setIncident_id(messageRequest.incident_id);
            newMessage.setDate_time();

            // Save message to database
            MessagesTable messagesTable = new MessagesTable();
            messagesTable.createNewMessage(newMessage);

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

    // Helper method to create incident info map for frontend
    private HashMap<String, HashMap<String, String>> createIncidentInfoMap(ArrayList<Incident> incidents) {
        HashMap<String, HashMap<String, String>> incidentInfo = new HashMap<>();

        for (Incident incident : incidents) {
            HashMap<String, String> info = new HashMap<>();
            info.put("type", incident.getIncident_type() != null ? incident.getIncident_type() : "Unknown");
            info.put("municipality", incident.getMunicipality() != null ? incident.getMunicipality() : "Unknown");
            info.put("status", incident.getStatus() != null ? incident.getStatus() : "Unknown");

            incidentInfo.put(String.valueOf(incident.getIncident_id()), info);
        }

        return incidentInfo;
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
        HashMap<String, HashMap<String, String>> incident_info;
    }
}