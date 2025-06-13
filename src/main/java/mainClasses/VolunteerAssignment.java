package mainClasses;

public class VolunteerAssignment {
    private int volunteer_user_id;
    private int incident_id;
    private String assignment_date;

    // Constructors
    public VolunteerAssignment() {}

    public VolunteerAssignment(int volunteer_user_id, int incident_id) {
        this.volunteer_user_id = volunteer_user_id;
        this.incident_id = incident_id;
    }

    // Getters and setters
    public int getVolunteer_user_id() { return volunteer_user_id; }
    public void setVolunteer_user_id(int volunteer_user_id) { this.volunteer_user_id = volunteer_user_id; }

    public int getIncident_id() { return incident_id; }
    public void setIncident_id(int incident_id) { this.incident_id = incident_id; }

    public String getAssignment_date() { return assignment_date; }
    public void setAssignment_date(String assignment_date) { this.assignment_date = assignment_date; }
}