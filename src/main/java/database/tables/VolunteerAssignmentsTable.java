package database.tables;

import com.google.gson.Gson;
import database.DB_Connection;
import mainClasses.VolunteerAssignment;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;

public class VolunteerAssignmentsTable {

    public void createAssignmentsTable() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String sql = "CREATE TABLE volunteer_assignments "
                + "(volunteer_user_id INTEGER not NULL, "
                + "incident_id INTEGER not NULL, "
                + "assignment_date DATETIME DEFAULT CURRENT_TIMESTAMP, "
                + "FOREIGN KEY (volunteer_user_id) REFERENCES users(user_id), "
                + "FOREIGN KEY (incident_id) REFERENCES incidents(incident_id), "
                + "PRIMARY KEY (volunteer_user_id, incident_id))";
        stmt.execute(sql);
        stmt.close();
        con.close();
    }

    public void addAssignmentFromJSON(String json) throws SQLException, ClassNotFoundException {
        VolunteerAssignment assignment = jsonToAssignment(json);
        createNewAssignment(assignment);
    }

    public VolunteerAssignment jsonToAssignment(String json) {
        Gson gson = new Gson();
        return gson.fromJson(json, VolunteerAssignment.class);
    }

    public boolean createNewAssignment(VolunteerAssignment assignment) throws SQLException,ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        try {
            String insertQuery = "INSERT INTO volunteer_assignments (volunteer_user_id, incident_id) VALUES ("
                    + assignment.getVolunteer_user_id() + ", "
                    + assignment.getIncident_id() + ")";

            int result = stmt.executeUpdate(insertQuery);
            return result > 0;
        } catch (SQLException e) {
            if (e.getMessage().contains("Duplicate entry")) {
                return false;
            }
            throw e;
        } finally {
            stmt.close();
            con.close();
        }
    }

    public ArrayList<Integer> getAssignedIncidentIds(int volunteerUserId) throws SQLException, ClassNotFoundException {
            Connection con = DB_Connection.getConnection();
            Statement stmt = con.createStatement();
            ArrayList<Integer> incidentIds = new ArrayList<>();

        try {
            ResultSet rs = stmt.executeQuery("SELECT incident_id FROM volunteer_assignments WHERE volunteer_user_id = " + volunteerUserId);
            while (rs.next()) {
                incidentIds.add(rs.getInt("incident_id"));
            }
        } finally {
            stmt.close();
            con.close();
        }
        return incidentIds;
    }



    public boolean removeAssignment(int volunteerUserId, int incidentId) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        try {
            String deleteQuery = "DELETE FROM volunteer_assignments WHERE volunteer_user_id = "
                    + volunteerUserId + " AND incident_id = " + incidentId;
            int result = stmt.executeUpdate(deleteQuery);
            return result > 0;
        } finally {
            stmt.close();
            con.close();
        }
    }



    public ArrayList<HashMap<String, Object>> getAllAssignmentsWithDetails() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<HashMap<String, Object>> assignments = new ArrayList<>();

        try {
            // Join with users and incidents tables to get meaningful data
            String query = "SELECT va.volunteer_user_id, va.incident_id, va.assignment_date, " +
                    "u.username, u.firstname, u.lastname, " +
                    "i.incident_type, i.description " +
                    "FROM volunteer_assignments va " +
                    "JOIN users u ON va.volunteer_user_id = u.user_id " +
                    "JOIN incidents i ON va.incident_id = i.incident_id";

            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                HashMap<String, Object> assignment = new HashMap<>();
                assignment.put("volunteer_user_id", rs.getInt("volunteer_user_id"));
                assignment.put("incident_id", rs.getInt("incident_id"));
                assignment.put("assignment_date", rs.getString("assignment_date"));
                assignment.put("volunteer_name", rs.getString("firstname") + " " + rs.getString("lastname") + " (" + rs.getString("username") + ")");
                assignment.put("incident_description", rs.getString("incident_type") + ": " + rs.getString("description"));

                assignments.add(assignment);
            }
        } finally {
            stmt.close();
            con.close();
        }
        return assignments;
    }
}