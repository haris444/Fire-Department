package servlets.admin;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;

public class AdminLogoutServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Get existing session (don't create new one)
        HttpSession session = request.getSession(false);

        // If session exists, invalidate it
        if (session != null) {
            session.invalidate();
        }

        // Always respond with success
        response.setStatus(HttpServletResponse.SC_OK);
        PrintWriter out = response.getWriter();
        out.print("{\"success\": true, \"message\": \"Logout successful\"}");
        out.flush();
    }
}