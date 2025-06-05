package servlets.admin;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;

public class BaseAdminServlet extends HttpServlet {

    protected boolean checkAdminSession(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);

        if (session == null) {
            sendErrorResponse(response);
            return false;
        }

        Object adminUser = session.getAttribute("adminUser");
        if (adminUser == null || !adminUser.equals("true")) {
            sendErrorResponse(response);
            return false;
        }

        String sessionToken = request.getHeader("X-Session-Token");
        if (sessionToken == null || !sessionToken.equals(session.getId())) {
            sendErrorResponse(response);
            return false;
        }

        return true;
    }

    private void sendErrorResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();
        out.print("{\"success\": false, \"message\": \"Admin authentication required.\"}");
        out.flush();
    }
}