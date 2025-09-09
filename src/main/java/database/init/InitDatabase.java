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
        //stmt.executeUpdate(sql);
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
        UsersTable eut = new UsersTable();
        eut.createUsersTable();

        IncidentsTable editIncidents = new IncidentsTable();
        editIncidents.createIncidentsTable();

        MessagesTable editMsgs = new MessagesTable();
        editMsgs.createMessageTable();

        // Add the new assignments table
        VolunteerAssignmentsTable editAssignments = new VolunteerAssignmentsTable();
        editAssignments.createAssignmentsTable();
    }

    public void addToDatabaseExamples() throws ClassNotFoundException, SQLException {

        //Users & volunteers
        UsersTable eut = new UsersTable();
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
        IncidentsTable editIncidents = new IncidentsTable();
        editIncidents.addIncidentFromJSON(Resources.incident1);
        editIncidents.addIncidentFromJSON(Resources.incident2);
        editIncidents.addIncidentFromJSON(Resources.incident3);
        editIncidents.addIncidentFromJSON(Resources.incident4);
        editIncidents.addIncidentFromJSON(Resources.incident5);

        //volunteer assignments
        VolunteerAssignmentsTable editAssignments = new VolunteerAssignmentsTable();
        editAssignments.addAssignmentFromJSON(Resources.assignment1);
        editAssignments.addAssignmentFromJSON(Resources.assignment2);
        editAssignments.addAssignmentFromJSON(Resources.assignment3);
        editAssignments.addAssignmentFromJSON(Resources.assignment4);

        //messages
        MessagesTable editMessages = new MessagesTable();
        editMessages.addMessageFromJSON(Resources.message1);
        editMessages.addMessageFromJSON(Resources.message2);
    }






}