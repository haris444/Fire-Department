package servlets.user;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.EditUsersTable;
import database.tables.CheckForDuplicatesExample;
import database.DB_Connection;
import mainClasses.User;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

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
            CheckForDuplicatesExample duplicateChecker = new CheckForDuplicatesExample();
            boolean usernameAvailable = duplicateChecker.isUserNameAvailable(user.getUsername());

            // Check if email is available
            boolean emailAvailable = duplicateChecker.isEmailAvailable(user.getEmail());

            // If username or email is already taken
            if (!usernameAvailable || !emailAvailable) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Username or email already exists.\"}");
                out.flush();
                return;
            }

            // Try to register the user
            EditUsersTable editUsersTable = new EditUsersTable();
            editUsersTable.addNewUser(user);

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