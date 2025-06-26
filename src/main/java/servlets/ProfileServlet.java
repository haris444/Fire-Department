package servlets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.UsersTable;
import mainClasses.User;

import java.io.IOException;
import java.io.PrintWriter;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.*;
/**
 * Universal Profile Servlet for users and volunteers
 */
public class ProfileServlet extends BaseServlet {


    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

        if (!isUserAuthenticated(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            HttpSession session = request.getSession(false);

            String loggedInUsername = (String) session.getAttribute("loggedInUsername");


            UsersTable usersTable = new UsersTable();
            User user = usersTable.getUserByUsername(loggedInUsername);

            Gson gson = new Gson();
            // invalidate the password before sending to frontend
            user.setPassword("");

            String userJson = gson.toJson(user);

            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(userJson);
            out.flush();


        } catch (Exception e) {
            System.err.println("Error fetching user profile: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching profile data\"}");
            out.flush();
        }
    }



    private static final Set<String> DOUBLE_FIELDS = Set.of("lat", "lon", "height", "weight");
    private static final Set<String> ALL_FIELDS = Set.of(
            "firstname", "lastname", "birthdate", "gender", "afm", "country",
            "address", "municipality", "prefecture", "job", "telephone",
            "volunteer_type", "lat", "lon", "height", "weight"
    );

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!isUserAuthenticated(request, response)) return;

        response.setContentType("application/json");

        try {
            String username = (String) request.getSession(false).getAttribute("loggedInUsername");
            
            String jsonString = getJSONFromAjax(request.getReader());

            JsonObject jsonObject = new JsonParser().parse(jsonString).getAsJsonObject();
            Map<String, Object> updates = new HashMap<>();

            for (String field : ALL_FIELDS) {
                if (jsonObject.has(field) && !jsonObject.get(field).isJsonNull()) {
                    if (DOUBLE_FIELDS.contains(field)) {
                        updates.put(field, jsonObject.get(field).getAsDouble());
                    } else {
                        updates.put(field, jsonObject.get(field).getAsString());
                    }
                }
            }
            UsersTable usersTable = new UsersTable();

            boolean success = !updates.isEmpty() && usersTable.updateUserProfile(username, updates);

            response.getWriter().print("{\"success\": " + success + "}");

        } catch (Exception e) {
            response.getWriter().print("{\"success\": false}");
        }
    }
    private boolean isUserAuthenticated(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);

        if (session == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"No active session. Please login.\"}");
            out.flush();
            return false;
        }

        String userRole = (String) session.getAttribute("userRole");

        if ("REGULAR_USER".equals(userRole) || "VOLUNTEER".equals(userRole)) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        PrintWriter out = response.getWriter();
        out.print("{\"success\": false, \"message\": \"Access denied. Insufficient privileges.\"}");
        out.flush();
        return false;
    }
}
