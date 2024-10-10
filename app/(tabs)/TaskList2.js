/*  TODO

ADD SEARCH function back -- done.
add filters back -- done.
take out the complete field when creating task -- done.
create task button as a plus symbol -- done.
put in ryans checkbox -- done and it now updates the database when clicked on to completed.

remove delete button in favor of a slide to delete function.
add user authentication -- oh boy.

task generes (personal, fitness, study, etc)
add icon to show task genre
priorities to tasks (high priority, low priority)
additional date that tells the app when to send a notification (potentially (still working on this idea))

*/ //  TODO

import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Text, TextInput } from 'react-native';
import { supabase } from '../../components/supabaseClient';
import Task from '../../components/Task';
import EditTaskModal from '../../components/EditTaskModal';
import CreateTaskModal from '../../components/CreateTaskModal';
import { isAfter } from 'date-fns';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks_table').select('*');
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle task deletion
  const handleDelete = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Open edit modal with selected task
  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditModalVisible(true);
  };

  // Open create task modal
  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  // Close create modal
  const closeCreateModal = () => {
    setCreateModalVisible(false);
  };

  // Render each task as an item
  const renderTaskItem = ({ item }) => (
    <Task
      key={item.id}
      taskId={item.id}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  const filteredTasks = () => {
    return tasks.filter((task) => {
      const taskNameMatch = task.task_name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!taskNameMatch) return false;

      const dueDate = new Date(task.due_date);
      if (filterStatus === 'all') return true;
      if (filterStatus === 'completed') return taskNameMatch && task.is_completed;
      if (filterStatus === 'pending') return taskNameMatch && !task.is_completed && !isAfter(new Date(), new Date(task.due_date));
      if (filterStatus === 'overdue') return taskNameMatch && !task.is_completed && isAfter(new Date(), new Date(task.due_date));

      return false;
    });
  };

  return (
    <View style={styles.container}>
      
      {/* search bar */}
      <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
      />
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'all' && styles.activeFilter]}
          onPress={() => setFilterStatus('all')}
        >
          <Text>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'pending' && styles.activeFilter]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'overdue' && styles.activeFilter]}
          onPress={() => setFilterStatus('overdue')}
        >
          <Text>Overdue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'completed' && styles.activeFilter]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text>Completed</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredTasks()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Create Task Button */}
      <TouchableOpacity style={styles.fabButton} onPress={handleCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>



      {/* Render EditTaskModal */}
      {isEditModalVisible && (
        <EditTaskModal
          task={selectedTask}
          isVisible={isEditModalVisible}
          onClose={() => setEditModalVisible(false)}
          onUpdate={fetchTasks} // Refresh task list after updating
        />
      )}

      {/* Render CreateTaskModal */}
      {isCreateModalVisible && (
        <CreateTaskModal
          isVisible={isCreateModalVisible}
          onClose={closeCreateModal}
          onCreate={fetchTasks} // Refresh task list after creating
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e5e5e5',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    color: '#ffffff',
  },
  createButtonContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default TaskList;