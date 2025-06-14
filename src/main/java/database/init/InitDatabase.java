package database.init;
import database.tables.*;

import static database.DB_Connection.getInitialConnection;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;


public class InitDatabase {

    public static void main(String[] args) throws SQLException, ClassNotFoundException {
        InitDatabase init = new InitDatabase();
        init.dropDatabase();

        init.initDatabase();
        init.initTables();
        init.addToDatabaseExamples();

    }

    public void dropDatabase() throws SQLException, ClassNotFoundException {
        Connection conn = getInitialConnection();
        Statement stmt = conn.createStatement();
        String sql = "DROP DATABASE  HY359_2024";
        stmt.executeUpdate(sql);
        System.out.println("Database dropped successfully...");
    }

    public void initDatabase() throws SQLException, ClassNotFoundException {
        Connection conn = getInitialConnection();
        Statement stmt = conn.createStatement();
        stmt.execute("CREATE DATABASE HY359_2024");
        stmt.close();
        conn.close();
    }

    public void initTables() throws SQLException, ClassNotFoundException {
        EditUsersTable eut = new EditUsersTable();
        eut.createUsersTable();

        EditIncidentsTable editIncidents = new EditIncidentsTable();
        editIncidents.createIncidentsTable();

        EditMessagesTable editMsgs = new EditMessagesTable();
        editMsgs.createMessageTable();

        // Add the new assignments table
        EditVolunteerAssignmentsTable editAssignments = new EditVolunteerAssignmentsTable();
        editAssignments.createAssignmentsTable();
    }

    public void addToDatabaseExamples() throws ClassNotFoundException, SQLException {

        //Users & volunteers
        EditUsersTable eut = new EditUsersTable();
        eut.addUserFromJSON(Resources.admin);
        eut.addUserFromJSON(Resources.user1JSON);
        eut.addUserFromJSON(Resources.user2JSON);
        eut.addUserFromJSON(Resources.user3JSON);
        eut.addUserFromJSON(Resources.user4JSON);
        eut.addUserFromJSON(Resources.volunteer1JSON);
        eut.addUserFromJSON(Resources.volunteer2JSON);
        eut.addUserFromJSON(Resources.volunteer3JSON);
        eut.addUserFromJSON(Resources.volunteer4JSON);

        //incidents
        EditIncidentsTable editIncidents = new EditIncidentsTable();
        editIncidents.addIncidentFromJSON(Resources.incident1);
        editIncidents.addIncidentFromJSON(Resources.incident2);
        editIncidents.addIncidentFromJSON(Resources.incident3);
        editIncidents.addIncidentFromJSON(Resources.incident4);
        editIncidents.addIncidentFromJSON(Resources.incident5);

        //volunteer assignments
        EditVolunteerAssignmentsTable editAssignments = new EditVolunteerAssignmentsTable();
        editAssignments.addAssignmentFromJSON(Resources.assignment1);
        editAssignments.addAssignmentFromJSON(Resources.assignment2);
        editAssignments.addAssignmentFromJSON(Resources.assignment3);
        editAssignments.addAssignmentFromJSON(Resources.assignment4);

        //messages
        EditMessagesTable editMessages = new EditMessagesTable();
        editMessages.addMessageFromJSON(Resources.message1);
        editMessages.addMessageFromJSON(Resources.message2);
    }






}