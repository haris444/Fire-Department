package database.tables;

import com.google.gson.Gson;
import database.DB_Connection;
import mainClasses.VolunteerAssignment;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;

public class EditVolunteerAssignmentsTable {

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

    public void addAssignmentFromJSON(String json) throws ClassNotFoundException {
        VolunteerAssignment assignment = jsonToAssignment(json);
        createNewAssignment(assignment);
    }

    public VolunteerAssignment jsonToAssignment(String json) {
        Gson gson = new Gson();
        return gson.fromJson(json, VolunteerAssignment.class);
    }

    public void createNewAssignment(VolunteerAssignment assignment) throws ClassNotFoundException {
        try {
            Connection con = DB_Connection.getConnection();
            Statement stmt = con.createStatement();

            String insertQuery = "INSERT INTO volunteer_assignments (volunteer_user_id, incident_id) VALUES ("
                    + assignment.getVolunteer_user_id() + ", "
                    + assignment.getIncident_id() + ")";

            stmt.executeUpdate(insertQuery);
            System.out.println("# Assignment added successfully");
            stmt.close();
            con.close();
        } catch (SQLException ex) {
            System.err.println("Error adding assignment: " + ex.getMessage());
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

    public boolean assignVolunteerToIncident(int volunteerUserId, int incidentId) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        try {
            String insertQuery = "INSERT INTO volunteer_assignments (volunteer_user_id, incident_id) VALUES ("
                    + volunteerUserId + ", " + incidentId + ")";
            int result = stmt.executeUpdate(insertQuery);
            return result > 0;
        } catch (SQLException e) {
            // Ignore duplicate key errors (assignment already exists)
            if (e.getMessage().contains("Duplicate entry")) {
                return false;
            }
            throw e;
        } finally {
            stmt.close();
            con.close();
        }
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

    public ArrayList<VolunteerAssignment> getAllAssignments() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<VolunteerAssignment> assignments = new ArrayList<>();

        try {
            ResultSet rs = stmt.executeQuery("SELECT * FROM volunteer_assignments");
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                VolunteerAssignment assignment = gson.fromJson(json, VolunteerAssignment.class);
                assignments.add(assignment);
            }
        } finally {
            stmt.close();
            con.close();
        }
        return assignments;
    }
}