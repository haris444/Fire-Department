package servlets.user;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;

public class BaseUserServlet extends HttpServlet {

    /**
     * Checks if the user session is valid and authenticated.
     * Validates both session attributes and session token.
     *
     * @param request The HTTP request
     * @param response The HTTP response
     * @return true if session is valid, false otherwise
     * @throws IOException if response writing fails
     */
    protected boolean checkUserSession(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);

        if (session == null) {
            sendErrorResponse(response);
            return false;
        }

        Object loggedInUser = session.getAttribute("loggedInUserUsername");
        Object userRole = session.getAttribute("userRole");

        if (loggedInUser == null || userRole == null || !userRole.equals("REGULAR_USER")) {
            sendErrorResponse(response);
            return false;
        }

        String sessionToken = request.getHeader("X-User-Session-Token");
        if (sessionToken == null || !sessionToken.equals(session.getId())) {
            sendErrorResponse(response);
            return false;
        }

        return true;
    }

    /**
     * Sends an unauthorized error response in JSON format.
     *
     * @param response The HTTP response
     * @throws IOException if response writing fails
     */
    private void sendErrorResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        out.print("{\"success\": false, \"message\": \"User authentication required.\"}");
        out.flush();
    }
}