package servlets.user;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.UsersTable;
import mainClasses.User;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

public class UserRegisterServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Read JSON payload from request body
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON to User object
            Gson gson = new Gson();
            User user = gson.fromJson(jsonBuffer.toString(), User.class);

            // Check if username is available
            UsersTable usersTable = new UsersTable();
            boolean usernameAvailable = usersTable.getUserByUsername(user.getUsername()) == null;


            // If username or email is already taken
            if (!usernameAvailable ) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Username already exists.\"}");
                out.flush();
                return;
            }


            usersTable.addNewUser(user);

            // If registration successful
            response.setStatus(HttpServletResponse.SC_CREATED);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": true, \"message\": \"Registration successful. Please login.\"}");
            out.flush();

        } catch (Exception e) {
            // Handle any exceptions (JSON parsing, database errors, etc.)
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Registration failed. Please try again.\"}");
            out.flush();
        }
    }


}