package servlets.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.UsersTable;
import mainClasses.User;
import servlets.BaseServlet;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

public class AdminVolunteersServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check admin session
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get all volunteers from database using the existing method
            UsersTable usersTable = new UsersTable();
            ArrayList<User> volunteers = usersTable.getAllVolunteers();

            // Convert to JSON
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(volunteers);

            // Send response
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);
            out.flush();

        } catch (Exception e) {
            // Handle database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching volunteers\"}");
            out.flush();
        }
    }
}