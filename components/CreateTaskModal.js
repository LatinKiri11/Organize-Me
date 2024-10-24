import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from './supabaseClient';

const CreateTaskModal = ({ isVisible, onClose, onCreate }) => {
  const [newTask, setNewTask] = useState({
    task_name: '',
    description: '',
    time_to_take: '',
    due_date: '', // Expected to be a valid timestamp string
    repeating: 0, // Default to 0 (non-repeating)
    is_completed: 0, // Default to false
    user_id: null, // To store the user's id
  });

  const [user, setUser] = useState(null);

  // Fetch the current user session to get the user ID
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

  // Handle task creation
  const handleCreate = async () => {
    try {
      // Attach user_id to the task
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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
    >
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

          <TextInput
            placeholder="Due Date (YYYY-MM-DD)"
            value={newTask.due_date}
            onChangeText={(text) => setNewTask({ ...newTask, due_date: text })}
            style={styles.input}
          />

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
