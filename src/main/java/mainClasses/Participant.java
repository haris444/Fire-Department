/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package mainClasses;

/**
 *
 * @author Mike
 */
public class Participant {
    int participant_id, incident_id;
    String volunteer_type,volunteer_username;
    String status, success,comment;

    public int getParticipant_id() {
        return participant_id;
    }

    public void setParticipant_id(int participant_id) {
        this.participant_id = participant_id;
    }

    public int getIncident_id() {
        return incident_id;
    }

    public void setIncident_id(int incident_id) {
        this.incident_id = incident_id;
    }

    public String getVolunteer_type() {
        return volunteer_type;
    }

    public void setVolunteer_type(String volunteer_type) {
        this.volunteer_type = volunteer_type;
    }

    public String getVolunteer_username() {
        return volunteer_username;
    }

    public void setVolunteer_username(String volunteer_username) {
        this.volunteer_username = volunteer_username;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSuccess() {
        return success;
    }

    public void setSuccess(String success) {
        this.success = success;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
    
}
