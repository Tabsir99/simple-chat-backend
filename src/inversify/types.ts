export const TYPES = {
  // User
  UserService: Symbol.for("UserService"),
  UserRepository: Symbol.for("UserRepository"),
  UserController: Symbol.for("UserController"),

  // Authentication
  AuthController: Symbol.for("AuthController"),
  AuthService: Symbol.for("AuthService"),
  AuthRepository: Symbol.for("AuthRepository"),

  // Response and Config
  ConfigService: Symbol.for("ConfigService"),
  CookieManager: Symbol.for("CookieManager"),
  EmailService: Symbol.for("EmailService"),

  // Friendship
  FriendshipService: Symbol.for("FriendshipService"),
  FriendshipRepository: Symbol.for("FriendshipRepository"),
  FriendshipController: Symbol.for("FriendshipController"),

  // Chat
  ChatService: Symbol.for("ChatService"),
  ChatRepository: Symbol.for("ChatRepository"),
  ChatController: Symbol.for("ChatController"),

  // Messages
  MessageService: Symbol.for("MessageService"),
  MessageRepository: Symbol.for("MessageRepository"),
  MessageController: Symbol.for("MessageController"),

  // Notification
  NotificationService: Symbol.for("NotificationService"),
  NotificationRepository: Symbol.for("NotificationRepository"),
  NotificationController: Symbol.for("NotificationController"),

  MediaController: Symbol.for("MediaController"),
  MediaService: Symbol.for("MediaService"),

  WebSocketManager: Symbol.for("WebSocketManager"),
  ChatWebSocketHandler: Symbol.for("ChatWebSocketHandler"),
  UserWebSocketHandler: Symbol.for("UserWebSocketHandler"),
  MessageWebSocketHandler: Symbol.for("MessageWebSocketHandler"),
  NotificationWebSocketHandler: Symbol.for("NotificationWebSocketHandler"),

  EventManager: Symbol.for("EventManager"),
};
