'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Edit3, DollarSign } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  balance?: number;
}

export default function CreditManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [creditAction, setCreditAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditUpdate = async () => {
    if (!selectedUser || !amount) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: parseFloat(amount),
          action: creditAction,
          description
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, balance: result.newBalance }
            : u
        ));
        
        // Close dialog and reset
        setShowDialog(false);
        setSelectedUser(null);
        setAmount('');
        setDescription('');
        
        alert(`Credits updated successfully!\nPrevious: ${result.previousBalance}\nNew: ${result.newBalance}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update credits');
      }
    } catch (error) {
      alert('Failed to update credits');
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Credit Management</h2>
        <p className="text-sm text-gray-500">Add, subtract, or set user credits</p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Username</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Current Credits</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">{user.balance || 0}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDialog(true);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Manage Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Credit Management Dialog */}
      {showDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Manage Credits</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">User: <span className="font-medium">{selectedUser.username}</span></p>
              <p className="text-sm text-gray-600">Current Balance: <span className="font-medium">{selectedUser.balance || 0} credits</span></p>
            </div>

            <div className="space-y-4">
              {/* Action Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCreditAction('add')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      creditAction === 'add' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add
                  </button>
                  <button
                    onClick={() => setCreditAction('subtract')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      creditAction === 'subtract' 
                        ? 'bg-red-50 border-red-500 text-red-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Minus className="w-4 h-4 inline mr-1" />
                    Subtract
                  </button>
                  <button
                    onClick={() => setCreditAction('set')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      creditAction === 'set' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Edit3 className="w-4 h-4 inline mr-1" />
                    Set
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {creditAction === 'set' ? 'New Balance' : 'Amount'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note about this credit adjustment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              {/* Preview */}
              {amount && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Preview:</p>
                  <p className="font-medium">
                    {creditAction === 'add' && `${selectedUser.balance || 0} + ${amount} = ${(selectedUser.balance || 0) + parseFloat(amount || '0')}`}
                    {creditAction === 'subtract' && `${selectedUser.balance || 0} - ${amount} = ${Math.max(0, (selectedUser.balance || 0) - parseFloat(amount || '0'))}`}
                    {creditAction === 'set' && `New balance: ${amount}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setSelectedUser(null);
                  setAmount('');
                  setDescription('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditUpdate}
                disabled={!amount || processing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Update Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
