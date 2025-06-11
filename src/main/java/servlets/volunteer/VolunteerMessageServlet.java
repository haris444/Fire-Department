package servlets.volunteer;

import com.google.gson.Gson;
import database.tables.EditMessagesTable;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import mainClasses.Message;
import servlets.BaseServlet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

/**
 * Servlet to handle messaging for volunteers according to project rules.
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

            // Fetch messages according to the rules for volunteers
            ArrayList<Message> messages = messagesTable.getMessagesByRecipient(volunteerUsername);

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
            Message message = gson.fromJson(jsonBuffer.toString(), Message.class);

            // Validate recipient
            String recipient = message.getRecipient();
            if (!"admin".equals(recipient) && !"public".equals(recipient) && !"volunteers".equals(recipient)) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\": false, \"message\": \"Invalid recipient. Can only send to 'admin', 'public', or 'volunteers'.\"}");
                return;
            }

            // Create and save the message
            Message newMessage = new Message();
            newMessage.setSender(senderUsername);
            newMessage.setRecipient(recipient);
            newMessage.setMessage(message.getMessage());
            newMessage.setIncident_id(message.getIncident_id()); // incident_id is required from frontend
            newMessage.setDate_time(); // Set current timestamp

            EditMessagesTable messagesTable = new EditMessagesTable();
            messagesTable.createNewMessage(newMessage);

            response.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"success\": true, \"message\": \"Message sent successfully.\"}");

        } catch (ClassNotFoundException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error sending message.\"}");
            e.printStackTrace();
        }
    }
}
