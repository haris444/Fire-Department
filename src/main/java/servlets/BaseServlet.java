package servlets;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

public class BaseServlet extends HttpServlet {

    protected boolean checkSession(HttpServletRequest request, HttpServletResponse response,
                                   String requiredAttribute, String requiredValue) throws IOException {
        HttpSession session = request.getSession(false);

        if (session == null) {
            sendErrorResponse(response, "No active session. Please login.");
            return false;
        }

        Object attributeValue = session.getAttribute(requiredAttribute);
        if (attributeValue == null || !attributeValue.equals(requiredValue)) {
            sendErrorResponse(response, "Access denied. Insufficient privileges.");
            return false;
        }

        String sessionTokenHeader = request.getHeader("X-Session-Token");
        if (sessionTokenHeader == null) {
            sessionTokenHeader = request.getHeader("X-User-Session-Token");
        }

        if (sessionTokenHeader == null || !sessionTokenHeader.equals(session.getId())) {
            sendErrorResponse(response, "Invalid session token.");
            return false;
        }

        return true;
    }

    private void sendErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        out.print("{\"success\": false, \"message\": \"" + message + "\"}");
        out.flush();
    }

    protected String getJSONFromAjax(BufferedReader reader) throws IOException{
        StringBuilder buffer = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        String data = buffer.toString();
        return data;
    }
}