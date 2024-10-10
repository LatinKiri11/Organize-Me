import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from './supabaseClient';
import EditTaskModal from './EditTaskModal';
import { isAfter } from 'date-fns';
import { Circle } from 'react-native-progress';


const Task = ({ taskId, onDelete }) => {
  const [task, setTask] = useState(null);
  const [progressTime, setProgressTime] = useState(0);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks_table')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      setTask(data);
      setProgressTime(0);
    } catch (err) {
      console.error('Error fetching task:', err);
      Alert.alert('Error fetching task:', err.message);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const handleUpdate = async (updatedTask) => {
    try {
      const { error } = await supabase
        .from('tasks_table')
        .update(updatedTask)
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task:', error);
        Alert.alert('Error updating task:', error.message);
      } else {
        Alert.alert('Task updated successfully');
        setTask(updatedTask);
        setEditModalVisible(false);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tasks_table')
                .delete()
                .eq('id', task.id);

              if (error) {
                console.error('Error deleting task:', error);
                Alert.alert('Error deleting task:', error.message);
              } else {
                Alert.alert('Task deleted successfully');
                onDelete(task.id);
              }
            } catch (err) {
              console.error('Error:', err);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (!task) return <Text>Loading task...</Text>;

  
  const dueDate = new Date(task.due_date);
  const isOverdue = isAfter(new Date(), dueDate);

  const handleProgressClick = async () => {
    let newProgress = Math.min(progressTime + 0.25, 1); // Increment by 25%, max at 100%
    setProgressTime(newProgress); // Update the progress state

    // When progress reaches 100%, mark task as completed
    if (newProgress == 1) {
      const updatedTask = { ...task, is_completed: true };
      setTask(updatedTask);
      try {
        const { error } = await supabase
          .from('tasks_table')
          .update({ is_completed: true })
          .eq('id', task.id);

        if (error) {
          console.error('Error updating task status:', error);
          Alert.alert('Error updating task:', error.message);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.taskContainer, task.is_completed && styles.completedTask]}
      onPress={() => setEditModalVisible(true)}
    >
      <View style={styles.taskContainer}>
        <View style={styles.taskHeader}>
          <TouchableOpacity onPress={handleProgressClick} style={styles.progressContainer}>
            <CircularProgress progress={progressTime} size={40} />
          </TouchableOpacity>
          <Text style={styles.taskName}>{task.task_name}</Text>
          <View style={[styles.statusBadge, task.is_completed ? styles.completedBadge : (isOverdue ? styles.overdueBadge : styles.pendingBadge)]}>
            <Text style={styles.statusText}>
              {task.is_completed ? 'Completed' : (isOverdue ? 'Overdue' : 'Pending')}
            </Text>
          </View>
        </View>
        <Text style={styles.description}>{task.description}</Text>
        <View style={styles.taskDetails}>
          <Text style={styles.detailText}>📅 Due: {new Date(task.due_date).toLocaleDateString()}</Text>
          <Text style={styles.detailText}>⏱️ Time: {task.time_to_take}</Text>
          <Text style={styles.detailText}>🔄 Repeats: Every {task.repeating} days</Text>
        </View>

        {/* Container for the delete button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        <EditTaskModal
          visible={isEditModalVisible}
          task={task}
          onClose={() => setEditModalVisible(false)}
          onSave={handleUpdate}
        />
      </View>
    </TouchableOpacity>
  );
};

// CircularProgress function
const CircularProgress = ({ progress, size = 100, color = 'lightblue' }) => {
  return (
    <View style={styles.wheel}>
      <Circle
        progress={progress} // A value between 0 and 1
        size={size} // Size of the circle
        indeterminate={progress === null} // If true, it will show an indeterminate state
        color={color} // Color of the progress
        style={styles.progress}
      />
      {progress !== null && (
        <Text style={styles.progressText}>
          {(progress * 100).toFixed(0)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  taskContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 12,
    marginTop: 4,
  },
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 94,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    marginLeft: 94,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#007AFF',
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  overdueBadge: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: -30,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  wheel: {
    padding: 10,
    marginVertical: 5,
    flexDirection: 'row',
    marginBottom: -100,
  },
  progress: {
    marginBottom: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginRight: 10,
  },
});

export default Task;

