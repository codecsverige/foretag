import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";

// أنواع الإجراءات
export const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  OPTIMISTIC_DELETE: 'OPTIMISTIC_DELETE',
  REVERT_DELETE: 'REVERT_DELETE',
  OPTIMISTIC_CANCEL: 'OPTIMISTIC_CANCEL',
  REVERT_CANCEL: 'REVERT_CANCEL',
  REMOVE_BOOKING: 'REMOVE_BOOKING',
  RESTORE_BOOKING: 'RESTORE_BOOKING',
  UPDATE_NOTIFICATIONS: 'UPDATE_NOTIFICATIONS',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_NETWORK_ERROR: 'SET_NETWORK_ERROR',
  ADD_TO_CACHE: 'ADD_TO_CACHE',
  CLEAR_CACHE: 'CLEAR_CACHE'
};

// الحالة الأولية
const initialState = {
  // البيانات
  driverRides: [],
  passengerAds: [],
  seatBookings: [],
  unlocks: [],
  bookingsMap: {},
  
  // حالات التحميل
  loading: {
    global: false,
    driver: false,
    passenger: false,
    bookings: false,
    unlocks: false
  },
  
  // الأخطاء
  error: null,
  networkError: false,
  
  // التبويب النشط
  activeTab: 'driver',
  
  // الإشعارات
  notifications: {
    newDriver: false,
    newBookings: false,
    newUnlocks: false,
    newDriverCount: 0,
    newBookingsCount: 0,
    newUnlocksCount: 0
  },
  
  // التخزين المؤقت
  cache: new Map(),
  lastUpdate: null,
  
  // العمليات المحسنة
  optimisticUpdates: new Map()
};

// Reducer لإدارة الحالة
function myRidesReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.isLoading
        }
      };

    case ACTIONS.SET_DATA:
      return {
        ...state,
        [action.payload.dataType]: action.payload.data,
        loading: {
          ...state.loading,
          [action.payload.dataType]: false
        },
        error: null,
        lastUpdate: Date.now()
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: {
          global: false,
          driver: false,
          passenger: false,
          bookings: false,
          unlocks: false
        }
      };

    case ACTIONS.SET_NETWORK_ERROR:
      return {
        ...state,
        networkError: action.payload
      };

    case ACTIONS.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload
      };

    // التحديث المحسن - حذف فوري
    case ACTIONS.OPTIMISTIC_DELETE:
      const { id, dataType } = action.payload;
      const optimisticKey = `delete_${id}`;
      
      return {
        ...state,
        [dataType]: state[dataType].filter(item => item.id !== id),
        optimisticUpdates: new Map(state.optimisticUpdates).set(optimisticKey, {
          type: 'delete',
          dataType,
          originalItem: state[dataType].find(item => item.id === id)
        })
      };

    // إرجاع الحذف عند الفشل
    case ACTIONS.REVERT_DELETE:
      const revertKey = `delete_${action.payload.id}`;
      const revertUpdate = state.optimisticUpdates.get(revertKey);
      
      if (revertUpdate) {
        const newOptimistic = new Map(state.optimisticUpdates);
        newOptimistic.delete(revertKey);
        
        return {
          ...state,
          [revertUpdate.dataType]: [...state[revertUpdate.dataType], revertUpdate.originalItem],
          optimisticUpdates: newOptimistic
        };
      }
      return state;

    // إلغاء محسن
    case ACTIONS.OPTIMISTIC_CANCEL:
      const { bookingId, newStatus } = action.payload;
      const cancelKey = `cancel_${bookingId}`;
      
      return {
        ...state,
        seatBookings: state.seatBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus, cancelledAt: Date.now() }
            : booking
        ),
        optimisticUpdates: new Map(state.optimisticUpdates).set(cancelKey, {
          type: 'cancel',
          originalBooking: state.seatBookings.find(b => b.id === bookingId)
        })
      };

    // إرجاع الإلغاء عند الفشل
    case ACTIONS.REVERT_CANCEL:
      const cancelRevertKey = `cancel_${action.payload.bookingId}`;
      const cancelRevertUpdate = state.optimisticUpdates.get(cancelRevertKey);
      
      if (cancelRevertUpdate) {
        const newOptimistic = new Map(state.optimisticUpdates);
        newOptimistic.delete(cancelRevertKey);
        
        return {
          ...state,
          seatBookings: state.seatBookings.map(booking =>
            booking.id === action.payload.bookingId
              ? cancelRevertUpdate.originalBooking
              : booking
          ),
          optimisticUpdates: newOptimistic
        };
      }
      return state;

    case ACTIONS.UPDATE_NOTIFICATIONS:
      return {
        ...state,
        notifications: {
          ...state.notifications,
          ...action.payload
        }
      };

    case ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: {
          newDriver: false,
          newBookings: false,
          newUnlocks: false,
          newDriverCount: 0,
          newBookingsCount: 0,
          newUnlocksCount: 0
        }
      };

    case ACTIONS.ADD_TO_CACHE:
      const newCache = new Map(state.cache);
      newCache.set(action.payload.key, {
        data: action.payload.data,
        timestamp: Date.now()
      });
      return {
        ...state,
        cache: newCache
      };

    case ACTIONS.CLEAR_CACHE:
      return {
        ...state,
        cache: new Map()
      };

    // حذف الحجز نهائياً
    case ACTIONS.REMOVE_BOOKING:
      const removedBookingId = action.payload.bookingId;
      return {
        ...state,
        seatBookings: state.seatBookings.filter(booking => booking.id !== removedBookingId),
        // أيضاً إزالته من bookingsMap إذا كان موجوداً
        bookingsMap: Object.fromEntries(
          Object.entries(state.bookingsMap).map(([rideId, bookings]) => [
            rideId,
            bookings.filter(b => b.id !== removedBookingId)
          ])
        )
      };

    // استعادة الحجز عند فشل الحذف
    case ACTIONS.RESTORE_BOOKING:
      const restoredBooking = action.payload.booking;
      return {
        ...state,
        seatBookings: [...state.seatBookings, restoredBooking].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      };

    default:
      return state;
  }
}

// Context
const MyRidesStateContext = createContext();
const MyRidesDispatchContext = createContext();

// Provider Component
export function MyRidesProvider({ children }) {
  const [state, dispatch] = useReducer(myRidesReducer, initialState);

  // تحسين الأداء بـ memoization
  const memoizedState = useMemo(() => state, [state]);
  const memoizedDispatch = useMemo(() => dispatch, [dispatch]);

  return (
    <MyRidesStateContext.Provider value={memoizedState}>
      <MyRidesDispatchContext.Provider value={memoizedDispatch}>
        {children}
      </MyRidesDispatchContext.Provider>
    </MyRidesStateContext.Provider>
  );
}

// Hooks للوصول للحالة
export function useMyRidesState() {
  const context = useContext(MyRidesStateContext);
  if (!context) {
    throw new Error('useMyRidesState must be used within MyRidesProvider');
  }
  return context;
}

export function useMyRidesDispatch() {
  const context = useContext(MyRidesDispatchContext);
  if (!context) {
    throw new Error('useMyRidesDispatch must be used within MyRidesProvider');
  }
  return context;
}

// Hook مجمع للراحة
export function useMyRides() {
  return {
    state: useMyRidesState(),
    dispatch: useMyRidesDispatch()
  };
}
