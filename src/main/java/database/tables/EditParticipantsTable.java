/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package database.tables;

import com.google.gson.Gson;
import mainClasses.Participant;
import database.DB_Connection;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Mike
 */
public class EditParticipantsTable {

    public void addParticipantFromJSON(String json) throws ClassNotFoundException {
        Participant r = jsonToParticipant(json);
        createNewParticipant(r);
    }

    public Participant databaseToParticipant(int id) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT * FROM participants WHERE participant_id= '" + id + "'");
            rs.next();
            String json = DB_Connection.getResultsToJSON(rs);
            Gson gson = new Gson();
            Participant bt = gson.fromJson(json, Participant.class);
            return bt;
        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        }
        return null;
    }

    public Participant jsonToParticipant(String json) {
        Gson gson = new Gson();
        Participant r = gson.fromJson(json, Participant.class);
        return r;
    }

    public String participantToJSON(Participant r) {
        Gson gson = new Gson();

        String json = gson.toJson(r, Participant.class);
        return json;
    }

    public void acceptParticipant(int participantID, String volunteer_username) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String updateQuery = "UPDATE participants SET volunteer_username='" + volunteer_username + "', status='accepted' WHERE participant_id= '" + participantID + "'";
        stmt.executeUpdate(updateQuery);
        stmt.close();
        con.close();
    }
    
       public void finalStatusParticipant(int participantID, String success, String comment) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String updateQuery = "UPDATE participants SET status='finished', success='" + success + "', comment='"+
                comment+"' WHERE participant_id= '" + participantID + "'";
        stmt.executeUpdate(updateQuery);
        stmt.close();
        con.close();
    }

    public void createParticipantTable() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String sql = "CREATE TABLE participants "
                + "(participant_id INTEGER not NULL AUTO_INCREMENT, "
                + " incident_id INTEGER not NULL, "
                + " volunteer_username VARCHAR(30), "
                + " volunteer_type VARCHAR(10) not null, "
                + " status VARCHAR(15) not null, "
                + " success VARCHAR(10), "
                + " comment VARCHAR(300), "
                + "FOREIGN KEY (incident_id) REFERENCES incidents(incident_id), "
                + " PRIMARY KEY (participant_id ))";
        stmt.execute(sql);
        stmt.close();
        con.close();

    }

    /**
     * Establish a database connection and add in the database.
     *
     * @throws ClassNotFoundException
     */
    public void createNewParticipant(Participant par) throws ClassNotFoundException {
        try {
            Connection con = DB_Connection.getConnection();

            Statement stmt = con.createStatement();

            String insertQuery = "INSERT INTO "
                    + " participants (incident_id,volunteer_username,"
                    + "volunteer_type,status,success,comment)"
                    + " VALUES ("
                    + "'" + par.getIncident_id() + "',"
                    + "'" + par.getVolunteer_username()+ "',"
                    + "'" + par.getVolunteer_type() + "',"
                    + "'" + par.getStatus() + "',"
                    + "'" + par.getSuccess() + "',"
                    + "'" + par.getComment() + "'"
                    + ")";
            //stmt.execute(table);

            stmt.executeUpdate(insertQuery);
            System.out.println("# The participant was successfully added in the database.");

            /* Get the member id from the database and set it to the member */
            stmt.close();

        } catch (SQLException ex) {
            Logger.getLogger(EditParticipantsTable.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
