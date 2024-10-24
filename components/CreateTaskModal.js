import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { supabase } from './supabaseClient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateTaskModal = ({ isVisible, onClose, onCreate }) => {
  const [newTask, setNewTask] = useState({
    task_name: '',
    description: '',
    time_to_take: '',
    due_date: '', // Expected to be a valid timestamp string
    repeating: 0, // Default to 0 (non-repeating)
    is_completed: 0, // Default to 0
    user_id: null, // To store the user's id
  });

  const [user, setUser] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate());
    setNewTask((prev) => ({ ...prev, due_date: today.toISOString().split('T')[0] }));
  }, []);

  const fetchUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching user session:', error);
    } else {
      setUser(session?.user ?? null);
    }
  };

  useEffect(() => {
    fetchUser(); // Fetch the user when the modal mounts
  }, []);

  const handleCreate = async () => {
    try {
      const taskWithUserId = {
        ...newTask,
        user_id: user?.id || null, // Assign user_id if user exists, otherwise null for unassigned tasks
      };

      const { error } = await supabase
        .from('tasks_table')
        .insert([taskWithUserId]);

      if (error) {
        console.error('Error creating task:', error);
        Alert.alert('Error creating task:', error.message);
      } else {
        Alert.alert('Task created successfully');
        onClose();
        onCreate(); // Refresh task list
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleConfirm = (date) => {
    console.log("Date selected:", date); // Log the raw date picked by the user
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`; 
  
    console.log("Formatted date:", formattedDate); // Log the formatted date (this is what should be displayed)
    
    setNewTask({ ...newTask, due_date: formattedDate });
    setDatePickerVisibility(false);
  };
  

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Create Task</Text>

          <TextInput
            placeholder="Task Name"
            value={newTask.task_name}
            onChangeText={(text) => setNewTask({ ...newTask, task_name: text })}
            style={styles.input}
          />

          <TextInput
            placeholder="Description (optional)"
            value={newTask.description}
            onChangeText={(text) => setNewTask({ ...newTask, description: text })}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
          />

          <TextInput
            placeholder="Time to Take (optional)"
            value={newTask.time_to_take}
            onChangeText={(text) => setNewTask({ ...newTask, time_to_take: text })}
            style={styles.input}
          />

          <View style={styles.datePickerContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.webDatePickerContainer}>
                <ReactDatePicker
                  selected={newTask.due_date ? new Date(newTask.due_date) : null}
                  onChange={(date) => {
                    // Manually format the selected date to YYYY-MM-DD without time zone conversion
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
                    const day = String(date.getDate()).padStart(2, '0');

                    // Construct the date in YYYY-MM-DD format
                    const formattedDate = `${year}-${month}-${day}`;

                    // Update the state with the correctly formatted date
                    setNewTask({ ...newTask, due_date: formattedDate });
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  popperPlacement="top-start"
                  popperModifiers={{
                    preventOverflow: {
                      enabled: true,
                    },
                    hide: {
                      enabled: false,
                    },
                  }}
                  customInput={(
                    <TouchableOpacity style={styles.webDatePickerInput}>
                      <Text style={styles.inputText}>{newTask.due_date || "Select Date"}</Text>
                      <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                />

              </View>
            ) : (
              <>
                <TextInput
                  placeholder="Due Date (YYYY-MM-DD)"
                  value={newTask.due_date}
                  editable={false} // Prevent manual editing
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                  <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  onConfirm={handleConfirm}
                  onCancel={() => setDatePickerVisibility(false)}
                  date={new Date(newTask.due_date)} // Convert to Date object
                  minimumDate={new Date()} // Prevent past dates
                  display="default"
                />
              </>
            )}
          </View>

          <TextInput
            placeholder="Repeat every X days (optional)"
            value={newTask.repeating}
            onChangeText={(text) => setNewTask({ ...newTask, repeating: parseInt(text) || 0 })}
            style={styles.input}
            keyboardType="numeric"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  webDatePickerContainer: {
    position: 'relative',
    zIndex: 9999, // Ensure the calendar is the top layer
  },
  webDatePickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTaskModal;
